import { storefrontApiMutation } from '@/src/graphql/client';
import { AvailablePaymentMethodsType } from '@/src/graphql/selectors';
import React, { InputHTMLAttributes, forwardRef, useEffect, useState } from 'react';
import { Stack, TP, TH2 } from '@/src/components/atoms';

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useCheckout } from '@/src/state/checkout';
import { Banner } from '@/src/components/forms';
import { useTranslation } from 'next-i18next';
import styled from '@emotion/styled';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '@/src/components/molecules/Button';
import { CreditCard } from 'lucide-react';
import { usePush } from '@/src/lib/redirect';
import { AnimatePresence, motion } from 'framer-motion';
import { useChannels } from '@/src/state/channels';
import { PaymentMethod } from './PaymentMethod';

const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY;

interface OrderPaymentProps {
    availablePaymentMethods?: AvailablePaymentMethodsType[];
    stripeData?: { paymentIntent: string | null };
}

type FormValues = {
    paymentMethod: string;
};

type StandardMethodMetadata = {
    shouldDecline: boolean;
    shouldError: boolean;
    shouldErrorOnSettle: boolean;
};

const POSITIVE_DEFAULT_PAYMENT_STATUSES = ['PaymentAuthorized', 'PaymentSettled'];

export const OrderPayment: React.FC<OrderPaymentProps> = ({ availablePaymentMethods, stripeData }) => {
    const ctx = useChannels();
    const { t } = useTranslation('checkout');
    const { t: tError } = useTranslation('common');
    const { activeOrder } = useCheckout();
    const push = usePush();

    //For stripe
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [error, setError] = useState<string | null>(null);

    const {
        watch,
        handleSubmit,
        register,
        formState: { isSubmitting, isValid, errors },
    } = useForm<FormValues>({
        defaultValues: {
            paymentMethod: availablePaymentMethods?.[0]?.id
        },
        mode: 'onChange'
    });

    useEffect(() => {
        const initStripe = async () => {
            if (STRIPE_PUBLIC_KEY) {
                const stripePromise = await loadStripe(STRIPE_PUBLIC_KEY);
                if (stripePromise) setStripe(stripePromise);
            }
        };
        if (stripeData?.paymentIntent) initStripe();
    }, []);

    const defaultMethod = availablePaymentMethods?.find(m => m.code === 'standard-payment');

    const standardMethod = async (method: string, metadata: StandardMethodMetadata) => {
        try {
            setError(null);
            const { addPaymentToOrder } = await storefrontApiMutation(ctx)({
                addPaymentToOrder: [
                    { input: { method, metadata } },
                    {
                        __typename: true,
                        '...on Order': { state: true, code: true },
                        '...on IneligiblePaymentMethodError': {
                            message: true,
                            errorCode: true,
                            eligibilityCheckerMessage: true,
                        },
                        '...on NoActiveOrderError': {
                            message: true,
                            errorCode: true,
                        },
                        '...on OrderPaymentStateError': {
                            message: true,
                            errorCode: true,
                        },
                        '...on OrderStateTransitionError': {
                            message: true,
                            errorCode: true,
                            fromState: true,
                            toState: true,
                            transitionError: true,
                        },
                        '...on PaymentDeclinedError': {
                            errorCode: true,
                            message: true,
                            paymentErrorMessage: true,
                        },
                        '...on PaymentFailedError': {
                            errorCode: true,
                            message: true,
                            paymentErrorMessage: true,
                        },
                    },
                ],
            });
            if (addPaymentToOrder.__typename !== 'Order') {
                setError(tError(`errors.backend.${addPaymentToOrder.errorCode}`));
            } else if (POSITIVE_DEFAULT_PAYMENT_STATUSES.includes(addPaymentToOrder.state)) {
                push(`/checkout/confirmation/${addPaymentToOrder.code}`);
            }
        } catch (e) {
            console.log(e);
            setError(tError(`errors.backend.UNKNOWN_ERROR`));
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async data => {
        try {
            setError(null);
            
            if (!data.paymentMethod) {
                setError(t('paymentMethod.selectToContinue'));
                return;
            }

            const selectedMethod = availablePaymentMethods?.find(m => m.id === data.paymentMethod);
            
            if (!selectedMethod) {
                setError(t('paymentMethod.notAvailable'));
                return;
            }

            const { addPaymentToOrder } = await storefrontApiMutation(ctx)({
                addPaymentToOrder: [
                    { 
                        input: { 
                            method: selectedMethod?.code || '',
                            metadata: {
                                paymentMethod: selectedMethod?.code,
                                orderId: activeOrder?.id
                            } 
                        } 
                    },
                    {
                        __typename: true,
                        '...on Order': { state: true, code: true },
                        '...on IneligiblePaymentMethodError': {
                            message: true,
                            errorCode: true,
                            eligibilityCheckerMessage: true,
                        },
                        '...on NoActiveOrderError': {
                            message: true,
                            errorCode: true,
                        },
                        '...on OrderPaymentStateError': {
                            message: true,
                            errorCode: true,
                        },
                        '...on OrderStateTransitionError': {
                            message: true,
                            errorCode: true,
                            fromState: true,
                            toState: true,
                            transitionError: true,
                        },
                        '...on PaymentDeclinedError': {
                            errorCode: true,
                            message: true,
                            paymentErrorMessage: true,
                        },
                        '...on PaymentFailedError': {
                            errorCode: true,
                            message: true,
                            paymentErrorMessage: true,
                        },
                    },
                ],
            });

            console.log('Payment response:', addPaymentToOrder);

            if (addPaymentToOrder.__typename !== 'Order') {
                setError(tError('errors.backend.UNKNOWN_ERROR'));
            } else if (POSITIVE_DEFAULT_PAYMENT_STATUSES.includes(addPaymentToOrder.state as string)) {
                try {
                    await storefrontApiMutation(ctx)({
                        logout: {
                            success: true,
                            __typename: true
                        }
                    });
                } catch (e) {
                    console.error('Logout error:', e);
                }
                push(`/checkout/confirmation/${addPaymentToOrder.code}`);
            }
        } catch (e) {
            console.error('Payment error:', e);
            setError(tError('errors.backend.UNKNOWN_ERROR'));
        }
    };

    return activeOrder ? (
        <Stack w100 column itemsCenter>
            <Banner error={{ message: error ?? undefined }} clearErrors={() => setError(null)} />
            <PaymentForm onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack w100 column style={{ position: 'relative' }}>
                    <TH2 size="2rem" weight={500}>
                        Phương thức thanh toán
                    </TH2>
                    <PaymentMethod
                        selected={watch('paymentMethod')}
                        onChange={value => {
                            register('paymentMethod').onChange({
                                target: { value, name: 'paymentMethod' }
                            });
                        }}
                        paymentMethods={availablePaymentMethods ?? []}
                    />
                </Stack>

                <AnimatePresence>
                    {isValid ? (
                        <AnimationStack initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Button loading={isSubmitting} type="submit">
                                ĐẶT HÀNG
                            </Button>
                        </AnimationStack>
                    ) : (
                        <Stack w100 justifyCenter>
                            <TP size="1.5rem" weight={600}>
                                {t('paymentMethod.selectToContinue')}
                            </TP>
                        </Stack>
                    )}
                </AnimatePresence>
            </PaymentForm>
        </Stack>
    ) : null;
};

const GridTitle = styled(Stack)`
    padding: 1.5rem 3rem;
    background-color: ${p => p.theme.gray(200)};
`;

const Grid = styled.div`
    margin-top: 1.5rem;
    display: grid;
    grid-template-rows: 0fr;

    transition: grid-template-rows 0.3s ease-in-out;
`;

const CheckBox = styled.input`
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 5.5rem;
    cursor: pointer;

    :checked ~ div {
        grid-template-rows: 1fr;
    }
`;

const GridEntry = styled(Stack)`
    overflow: hidden;
`;

const StyledCreditCard = styled(CreditCard)<{ method: 'success' | 'decline' | 'error' }>`
    color: ${({ theme, method }) => (method === 'success' ? theme.success : theme.error)};
`;

const AbsoluteRadio = styled.input`
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    cursor: pointer;
`;

const StyledButton = styled.button<{ active?: boolean }>`
    position: relative;
    display: flex;
    gap: 3.5rem;
    align-items: center;
    justify-content: center;
    background-color: ${p => (p.active ? p.theme.background.ice : p.theme.gray(0))};
    border: 1px solid ${p => p.theme.background.ice};
    border-radius: 0.25rem;
    padding: 1.5rem 3rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: ${p => p.theme.background.ice};
    }
`;

const PaymentForm = styled.form`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 2rem;
    height: 100%;
`;

const AnimationStack = styled(motion.div)`
    position: relative;
    width: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
`;

type InputType = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon?: React.ReactNode;
};

const PaymentButton = forwardRef((props: InputType, ref: React.ForwardedRef<HTMLInputElement>) => {
    const { label, icon, ...rest } = props;
    return (
        <Stack w100 column itemsCenter gap="0.25rem">
            <StyledButton style={{ width: '100%', justifyContent: 'start' }} active={rest.checked}>
                {icon}
                <AbsoluteRadio ref={ref} {...rest} type="radio" />
                <label htmlFor={props.name}>{label}</label>
            </StyledButton>
        </Stack>
    );
});
