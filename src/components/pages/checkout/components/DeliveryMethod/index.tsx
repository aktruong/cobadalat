import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { ActiveOrderType, ShippingMethodType } from '@/src/graphql/selectors';
import styled from '@emotion/styled';
import React from 'react';
import { CurrencyCode } from '@/src/zeus';
import { Price } from '@/src/components/atoms';

interface Props {
    selected?: string;
    onChange: (id: string) => void;
    error?: string;
    shippingMethods: ShippingMethodType[];
    currencyCode?: ActiveOrderType['currencyCode'];
}

export const DeliveryMethod: React.FC<Props> = ({
    selected,
    onChange,
    error,
    shippingMethods,
    currencyCode = CurrencyCode.USD,
}) => {
    return (
        <Stack w100 column>
            <Wrapper gap="2rem">
                {shippingMethods?.map(({ id, name, price }) => (
                    <Box
                        justifyCenter
                        itemsCenter
                        w100
                        error={!!error}
                        selected={selected === id}
                        key={id}
                        column
                        onClick={() => onChange(id)}>
                        <TP size="1.5rem" weight={400} style={{ color: selected === id ? '#FFFFFF' : undefined }}>
                            {name}
                        </TP>
                        <Price price={price} currencyCode={currencyCode} />
                    </Box>
                ))}
            </Wrapper>
        </Stack>
    );
};

const Wrapper = styled(Stack)`
    margin: 1.6rem 0;
`;

const Box = styled(Stack)<{ selected: boolean; error: boolean }>`
    cursor: pointer;
    padding: 2rem;
    border: 1px solid ${p => (p.error ? p.theme.error : p.selected ? '#1877F2' : p.theme.gray(200))};
    background-color: ${p => p.selected ? '#1877F2' : 'transparent'};
    transition: all 0.3s ease;

    &:hover {
        border: 1px solid ${p => p.theme.gray(400)};
        background-color: ${p => p.selected ? '#1877F2' : '#F5F5F5'};
    }

    & > div {
        color: ${p => (p.selected ? '#FFFFFF' : p.theme.text.subtitle)};
        & > p {
            font-size: 1rem;
            color: ${p => (p.selected ? '#FFFFFF' : p.theme.text.subtitle)};
        }
    }

    & > div > div {
        color: ${p => (p.selected ? '#FFFFFF' : p.theme.text.subtitle)};
    }
`;
