import React from 'react';

import { TH2, TP } from '@/src/components/atoms/TypoGraphy';
import { Stack } from '@/src/components/atoms/Stack';
import { Button } from '@/src/components/molecules/Button';

import { usePush } from '@/src/lib/redirect';

import { storefrontApiMutation, storefrontApiQuery } from '@/src/graphql/client';
import {
    CreateAddressType,
    ShippingMethodType,
    AvailableCountriesType,
    CreateCustomerType,
    ActiveOrderSelector,
    ActiveCustomerType,
} from '@/src/graphql/selectors';

import { useForm, SubmitHandler } from 'react-hook-form';
import { Trans, useTranslation } from 'next-i18next';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, FormError, Banner, CountrySelect, CheckBox } from '@/src/components/forms';
import { DeliveryMethod } from '../DeliveryMethod';
import { useValidationSchema } from './useValidationSchema';
import { Link } from '@/src/components/atoms/Link';
import { useCheckout } from '@/src/state/checkout';
import { Info, MoveLeft } from 'lucide-react';
import { baseCountryFromLanguage } from '@/src/util/baseCountryFromLanguage';
import { OrderSummary } from '../OrderSummary';
import { useChannels } from '@/src/state/channels';
import { Tooltip } from '@/src/components/molecules/Tooltip';

type FormValues = CreateCustomerType & {
    fullName?: string;
    deliveryMethod?: string;
    shippingDifferentThanBilling?: boolean;
    shipping: CreateAddressType;
    billing: CreateAddressType;
    // userNeedInvoice?: boolean;
    // NIP?: string;
    createAccount?: boolean;
    password?: string;
    confirmPassword?: string;
    terms?: boolean;
};

interface OrderFormProps {
    availableCountries?: AvailableCountriesType[];
    activeCustomer: ActiveCustomerType | null;
    shippingMethods: ShippingMethodType[] | null;
}

const isAddressesEqual = (a: object, b?: object) => {
    try {
        return JSON.stringify(a) === JSON.stringify(b ?? {});
    } catch (e) {
        return false;
    }
};

const StyledLabel = styled.label`
    font-size: 1.5rem;
`;

const StyledInput = styled(Input)`
    & > label {
        font-size: 1.5rem;
    }
`;

export const OrderForm: React.FC<OrderFormProps> = ({ availableCountries, activeCustomer, shippingMethods }) => {
    const ctx = useChannels();
    const { activeOrder, changeShippingMethod } = useCheckout();

    const { t } = useTranslation('checkout');
    const { t: tErrors } = useTranslation('common');
    const push = usePush();
    const schema = useValidationSchema();

    const errorRef = React.useRef<HTMLDivElement>(null);

    const defaultShippingAddress = activeCustomer?.addresses?.find(address => address.defaultShippingAddress);
    const defaultBillingAddress = activeCustomer?.addresses?.find(address => address.defaultBillingAddress);

    const countryCode =
        defaultBillingAddress?.country.code ??
        defaultShippingAddress?.country.code ??
        availableCountries?.find(country => country.name === 'Poland')?.code ??
        baseCountryFromLanguage(ctx.locale);

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        watch,
        setFocus,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        delayError: 100,
        defaultValues: {
            shippingDifferentThanBilling: defaultShippingAddress
                ? !isAddressesEqual(defaultShippingAddress, defaultBillingAddress)
                : false,
            billing: { 
                countryCode,
                postalCode: '66000'
            },
            terms: true,
            // NIP: defaultBillingAddress?.customFields?.NIP ?? '',
            // userNeedInvoice: defaultBillingAddress?.customFields?.NIP ? true : false,
        },
        values: activeCustomer
            ? {
                  createAccount: false,
                  emailAddress: activeCustomer.emailAddress,
                  firstName: activeCustomer.firstName,
                  lastName: activeCustomer.lastName,
                  phoneNumber: activeCustomer.phoneNumber,
                  //   NIP: defaultBillingAddress?.customFields?.NIP ?? '',
                  //   userNeedInvoice: defaultBillingAddress?.customFields?.NIP ? true : false,
                  shippingDifferentThanBilling: defaultShippingAddress
                      ? !isAddressesEqual(defaultShippingAddress, defaultBillingAddress)
                      : false,
                  shipping: {
                      ...defaultShippingAddress,
                      streetLine1: defaultShippingAddress?.streetLine1 ?? '',
                      countryCode,
                  },
                  billing: {
                      ...defaultBillingAddress,
                      streetLine1: defaultBillingAddress?.streetLine1 ?? '',
                      countryCode,
                  },
              }
            : undefined,
        resolver: zodResolver(schema),
    });

    const onSubmit: SubmitHandler<FormValues> = async ({
        emailAddress,
        firstName,
        lastName,
        deliveryMethod,
        billing,
        shipping,
        phoneNumber,
        shippingDifferentThanBilling,
        createAccount,
        password,
    }) => {
        try {
            // Kiểm tra phương thức vận chuyển
            if (!deliveryMethod) {
                setError('deliveryMethod', { message: t('deliveryMethod.errors.required') });
                return;
            }

            if (deliveryMethod && activeOrder?.shippingLines[0]?.shippingMethod.id !== deliveryMethod) {
                await changeShippingMethod(deliveryMethod);
            }

            // Kiểm tra thông tin thanh toán
            if (!billing.streetLine1) {
                setError('billing.streetLine1', { message: t('orderForm.errors.streetLine1.required') });
                return;
            }
            if (!billing.city) {
                setError('billing.city', { message: t('orderForm.errors.city.required') });
                return;
            }
            if (!billing.province) {
                setError('billing.province', { message: t('orderForm.errors.province.required') });
                return;
            }

            // Kiểm tra trạng thái order trước khi tiếp tục
            if (!activeOrder) {
                console.log('No active order found, redirecting to home');
                push('/');
                return;
            }

            const { nextOrderStates } = await storefrontApiQuery(ctx)({ nextOrderStates: true });
            if (!nextOrderStates.includes('ArrangingPayment')) {
                setError('root', { message: tErrors(`errors.backend.UNKNOWN_ERROR`) });
                return;
            }

            // Set customer trước khi set địa chỉ
            if (!activeCustomer) {
                console.log('Active Customer before setCustomerForOrder:', activeCustomer);
                const { setCustomerForOrder } = await storefrontApiMutation(ctx)({
                    setCustomerForOrder: [
                        { input: { emailAddress, firstName, lastName, phoneNumber } },
                        {
                            __typename: true,
                            '...on Order': { id: true },
                            '...on AlreadyLoggedInError': { message: true, errorCode: true },
                            '...on EmailAddressConflictError': { message: true, errorCode: true },
                            '...on GuestCheckoutError': { message: true, errorCode: true },
                            '...on NoActiveOrderError': { message: true, errorCode: true },
                        },
                    ],
                });

                if (setCustomerForOrder?.__typename === 'NoActiveOrderError') {
                    console.log('NoActiveOrderError from setCustomerForOrder');
                    push('/');
                    return;
                }

                if (setCustomerForOrder?.__typename !== 'Order') {
                    if (setCustomerForOrder.__typename === 'EmailAddressConflictError') {
                        setError('emailAddress', {
                            message: tErrors(`errors.backend.${setCustomerForOrder.errorCode}`),
                        });
                        setFocus('emailAddress');
                    } else {
                        setError('root', { message: tErrors(`errors.backend.${setCustomerForOrder.errorCode}`) });
                    }
                    return;
                }
            }

            // Kiểm tra lại trạng thái order sau khi set customer
            if (!activeOrder) {
                console.log('No active order found after setCustomerForOrder, redirecting to home');
                push('/');
                return;
            }

            // Set the billing address for the order
            console.log('Before setOrderBillingAddress:', { activeOrder, activeCustomer });
            const { setOrderBillingAddress } = await storefrontApiMutation(ctx)({
                setOrderBillingAddress: [
                    {
                        input: {
                            ...billing,
                            defaultBillingAddress: false,
                            defaultShippingAddress: false,
                        },
                    },
                    {
                        __typename: true,
                        '...on Order': { id: true },
                        '...on NoActiveOrderError': { message: true, errorCode: true },
                    },
                ],
            });

            console.log('After setOrderBillingAddress:', { setOrderBillingAddress });

            if (setOrderBillingAddress?.__typename === 'NoActiveOrderError') {
                console.log('NoActiveOrderError from setOrderBillingAddress');
                push('/');
                return;
            }

            if (setOrderBillingAddress?.__typename !== 'Order') {
                setError('root', { message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
                return;
            }

            // Set the shipping address for the order
            if (shippingDifferentThanBilling) {
                // Set the shipping address for the order if it is different than billing
                const { setOrderShippingAddress } = await storefrontApiMutation(ctx)({
                    setOrderShippingAddress: [
                        { input: { ...shipping, defaultBillingAddress: false, defaultShippingAddress: false } },
                        {
                            __typename: true,
                            '...on Order': { id: true },
                            '...on NoActiveOrderError': { message: true, errorCode: true },
                        },
                    ],
                });

                if (setOrderShippingAddress?.__typename === 'NoActiveOrderError') {
                    console.log('NoActiveOrderError from setOrderShippingAddress');
                    push('/');
                    return;
                }
            } else {
                // Set the billing address for the order if it is the same as shipping
                const { setOrderShippingAddress } = await storefrontApiMutation(ctx)({
                    setOrderShippingAddress: [
                        { input: { ...billing, defaultBillingAddress: false, defaultShippingAddress: false } },
                        {
                            __typename: true,
                            '...on Order': { id: true },
                            '...on NoActiveOrderError': { message: true, errorCode: true },
                        },
                    ],
                });

                if (setOrderShippingAddress?.__typename === 'NoActiveOrderError') {
                    console.log('NoActiveOrderError from setOrderShippingAddress');
                    push('/');
                    return;
                }
            }

            // Set the order state to ArrangingPayment
            const { transitionOrderToState } = await storefrontApiMutation(ctx)({
                transitionOrderToState: [
                    { state: 'ArrangingPayment' },
                    {
                        __typename: true,
                        '...on Order': ActiveOrderSelector,
                        '...on OrderStateTransitionError': {
                            errorCode: true,
                            message: true,
                            fromState: true,
                            toState: true,
                            transitionError: true,
                        },
                    },
                ],
            });

            if (!transitionOrderToState) {
                setError('root', { message: tErrors(`errors.backend.UNKNOWN_ERROR`) });
                return;
            }

            if (transitionOrderToState?.__typename !== 'Order') {
                setError('root', { message: tErrors(`errors.backend.${transitionOrderToState.errorCode}`) });
                return;
            }

            // Chuyển hướng đến trang thanh toán
            push('/checkout/payment');
        } catch (error) {
            setError('root', { message: tErrors(`errors.backend.UNKNOWN_ERROR`) });
        }
    };

    return activeOrder?.totalQuantity === 0 ? (
        <Stack w100 column>
            <Stack column gap="2rem">
                <TH2 size="2rem" weight={500}>
                    {t('orderForm.emptyCart')}
                </TH2>
                <EmptyCartDescription>
                    <Trans i18nKey="orderForm.emptyCartDescription" t={t} components={{ 1: <Link href="/"></Link> }} />
                </EmptyCartDescription>
            </Stack>
        </Stack>
    ) : (
        <Stack w100 column>
            <Banner ref={errorRef} clearErrors={() => clearErrors('root')} error={errors?.root} />
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Container w100 gap="10rem">
                    <OrderSummary
                        shipping={
                            shippingMethods ? (
                                <DeliveryMethodWrapper>
                                    <DeliveryMethod
                                        selected={watch('deliveryMethod')}
                                        error={errors.deliveryMethod?.message}
                                        onChange={async id => {
                                            await changeShippingMethod(id);
                                            setValue('deliveryMethod', id);
                                            clearErrors('deliveryMethod');
                                        }}
                                        shippingMethods={shippingMethods}
                                        currencyCode={activeOrder?.currencyCode}
                                    />
                                </DeliveryMethodWrapper>
                            ) : null
                        }
                        footer={
                            <Stack column gap="2.5rem" justifyCenter itemsCenter>
                                <StyledButton loading={isSubmitting} type="submit">
                                    <TP color="contrast" upperCase>
                                        CHỌN LOẠI THANH TOÁN
                                    </TP>
                                </StyledButton>
                                <LinkButton href="/">CHỌN THÊM</LinkButton>
                            </Stack>
                        }
                    />
                    <Stack w100 column gap="2rem">
                        <Stack column gap="0.5rem">
                            {/* Customer Part */}
                            <Stack column gap="2rem">
                                <Stack gap="0.75rem" itemsCenter style={{ height: '2.6rem' }}>
                                    <AnimatePresence>
                                        {!isSubmitting ? (
                                            <BackButton href="/">
                                                <MoveLeft size={24} />
                                            </BackButton>
                                        ) : null}
                                    </AnimatePresence>
                                    <TH2 size="2rem" weight={500}>
                                        Thông tin giao hàng
                                    </TH2>
                                </Stack>

                                <Stack w100 column gap="1.5rem">
                                    <Stack w100 gap="1.5rem">
                                        <div style={{ display: 'none' }}>
                                            <Input
                                                {...register('firstName', {
                                                    onChange: e => {
                                                        const fullName = e.target.value.trim();
                                                        if (fullName) {
                                                            // Tách họ và tên
                                                            const nameParts = fullName.split(' ');
                                                            const firstName = nameParts[0];
                                                            const lastName = nameParts.slice(1).join(' ');
                                                            
                                                            // Cập nhật giá trị cho các trường
                                                            setValue('firstName', firstName);
                                                            setValue('lastName', lastName);
                                                        }
                                                    }
                                                })}
                                                placeholder={t('orderForm.placeholders.firstName')}
                                                label=""
                                                error={errors.firstName}
                                                required
                                            />
                                            <Input
                                                {...register('lastName')}
                                                placeholder={t('orderForm.placeholders.lastName')}
                                                label=""
                                                error={errors.lastName}
                                                required
                                            />
                                        </div>
                                    </Stack>
                                    <Stack w100 column gap="1.5rem">
                                        <StyledInput
                                            {...register('fullName', {
                                                onChange: e => {
                                                    const fullName = e.target.value.trim();
                                                    if (fullName) {
                                                        // Tách họ và tên
                                                        const nameParts = fullName.split(' ');
                                                        const firstName = nameParts[0];
                                                        const lastName = nameParts.slice(1).join(' ') || firstName;
                                                        
                                                        // Cập nhật giá trị cho các trường
                                                        setValue('firstName', firstName);
                                                        setValue('lastName', lastName);
                                                        // Cập nhật giá trị cho trường billing.fullName
                                                        setValue('billing.fullName', fullName);
                                                    }
                                                }
                                            })}
                                            label="Họ và tên:"
                                            error={errors.fullName}
                                            required
                                        />
                                        <StyledInput
                                            {...register('phoneNumber', {
                                                onChange: e => {
                                                    const phone = e.target.value.replace(/[^0-9]/g, '');
                                                    e.target.value = phone;
                                                    // Tự sinh email từ số điện thoại
                                                    if (phone) {
                                                        setValue('emailAddress', `${phone}@cahoicoba.com`);
                                                    }
                                                },
                                            })}
                                            type="tel"
                                            label="Số điện thoại:"
                                            error={errors.phoneNumber}
                                        />
                                    </Stack>
                                </Stack>
                            </Stack>

                            {/* Shipping Part */}
                            <BillingWrapper column>
                                <TH2 size="2rem" weight={500} style={{ marginBottom: '1.75rem', display: 'none' }}>
                                    {t('orderForm.billingInfo')}
                                </TH2>
                                <Stack w100 column gap="1.5rem">
                                    <Stack w100 column gap="1.5rem">
                                        <Input
                                            {...register('billing.streetLine1')}
                                            label="Địa chỉ:"
                                            error={errors.billing?.streetLine1}
                                            required
                                        />
                                        <Input
                                            {...register('billing.streetLine2')}
                                            label="Phường:"
                                            error={errors.billing?.streetLine2}
                                        />
                                        <Input
                                            {...register('billing.city')}
                                            label="Thành phố/Huyện:"
                                            error={errors.billing?.city}
                                            required
                                        />
                                        <Input
                                            {...register('billing.province')}
                                            label="Tỉnh:"
                                            error={errors.billing?.province}
                                            required
                                            defaultValue="Lâm Đồng"
                                        />
                                        {availableCountries && (
                                            <Stack style={{ display: 'none' }}>
                                                <CountrySelect
                                                    {...register('billing.countryCode')}
                                                    placeholder={t('orderForm.placeholders.countryCode')}
                                                    label={t('orderForm.countryCode')}
                                                    defaultValue={countryCode}
                                                    options={availableCountries}
                                                    error={errors.billing?.countryCode}
                                                    required
                                                />
                                            </Stack>
                                        )}
                                    </Stack>
                                    <div style={{ display: 'none' }}>
                                        <Input
                                            {...register('billing.postalCode')}
                                            placeholder={t('orderForm.placeholders.postalCode')}
                                            label={t('orderForm.postalCode')}
                                            error={errors.billing?.postalCode}
                                            required
                                        />
                                    </div>
                                    <Stack w100 gap="1.5rem" style={{ display: 'none' }}>
                                        <Input
                                            {...register('billing.company')}
                                            placeholder={t('orderForm.placeholders.company')}
                                            label={t('orderForm.company')}
                                            error={errors.billing?.company}
                                        />
                                    </Stack>
                                </Stack>
                            </BillingWrapper>
                        </Stack>

                        <Stack justifyBetween itemsCenter style={{ display: 'none' }}>
                            <CheckBox
                                {...register('shippingDifferentThanBilling', {
                                    onChange: e => {
                                        if (e.target.checked) {
                                            setValue('shipping.postalCode', '66000');
                                        }
                                    }
                                })}
                                checked={watch('shippingDifferentThanBilling')}
                                label={t('orderForm.shippingDifferentThanBilling')}
                            />
                        </Stack>

                        {/* Create Account */}
                        {!activeCustomer?.id ? (
                            <Stack column gap="1.25rem" style={{ display: 'none' }}>
                                <Stack itemsCenter gap="1rem">
                                    <CheckBox {...register('createAccount')} label={t('orderForm.createAccount')} />
                                    <Stack itemsCenter justifyCenter>
                                        <Tooltip text={t('orderForm.whatAccountGives')}>
                                            <Info size={12} />
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                                {watch('createAccount') && (
                                    <CreateAccountWrapper
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}>
                                        <Input
                                            {...register('password')}
                                            type="password"
                                            label={t('orderForm.password')}
                                            error={errors.password}
                                            required
                                        />
                                        <Input
                                            {...register('confirmPassword')}
                                            type="password"
                                            label={t('orderForm.confirmPassword')}
                                            error={errors.confirmPassword}
                                            required
                                        />
                                    </CreateAccountWrapper>
                                )}
                            </Stack>
                        ) : null}

                        {/* Submit */}
                        <Stack column justifyBetween gap="0.5rem" style={{ display: 'none' }}>
                            <CheckBox
                                {...register('terms')}
                                // error={errors.terms}
                                label={
                                    <Trans
                                        i18nKey="orderForm.terms"
                                        t={t}
                                        components={{
                                            1: <Link style={{ zIndex: 2, position: 'relative' }} href="/checkout" />,
                                        }}
                                    />
                                }
                                required
                            />
                            <AnimatePresence>
                                {errors.terms?.message && (
                                    <FormError
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}>
                                        {errors.terms?.message}
                                    </FormError>
                                )}
                            </AnimatePresence>
                        </Stack>
                    </Stack>
                </Container>
            </Form>
        </Stack>
    );
};

const Container = styled(Stack)`
    flex-direction: column-reverse;

    @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
        flex-direction: row-reverse;
    }
`;
const DeliveryMethodWrapper = styled(Stack)``;

const LinkButton = styled(Link)`
    width: 100%;
    text-align: center;
    color: ${p => p.theme.text.main};
    text-transform: uppercase;
    font-size: 1.5rem;
    font-weight: 600;
`;

const StyledButton = styled(Button)`
    width: 100%;
`;

const BackButton = styled(Link)`
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;

    color: ${({ theme }) => theme.gray(1000)};

    @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
        display: none;
    }
`;

const EmptyCartDescription = styled.div`
    font-size: 1.75rem;

    & > a {
        font-weight: 500;
        font-size: 1.75rem;
        color: ${p => p.theme.accent(800)};
        text-decoration: underline;
    }
`;

const BillingWrapper = styled(Stack)`
    margin-top: 1.75rem;
`;

const CreateAccountWrapper = styled(motion.div)`
    display: flex;
    gap: 1.25rem;
`;

const ShippingWrapper = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    margin-top: 1.75rem;
`;

// const FVInputWrapper = styled(motion.div)`
//     margin-top: 1.75rem;
//     position: relative;
// `;

const Form = styled.form`
    margin-top: 1.6rem;
`;
