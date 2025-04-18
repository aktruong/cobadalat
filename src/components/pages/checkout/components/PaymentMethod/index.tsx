import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { AvailablePaymentMethodsType } from '@/src/graphql/selectors';
import styled from '@emotion/styled';
import React from 'react';
import { CurrencyCode } from '@/src/zeus';

interface Props {
    selected?: string;
    onChange: (id: string) => void;
    error?: string;
    paymentMethods: AvailablePaymentMethodsType[];
}

export const PaymentMethod: React.FC<Props> = ({ selected, onChange, error, paymentMethods }) => {
    return (
        <Stack w100 column>
            <Wrapper gap="2rem">
                {paymentMethods?.map(({ id, name, description }) => (
                    <Box
                        justifyCenter
                        itemsCenter
                        w100
                        error={!!error}
                        selected={selected === id}
                        key={id}
                        column
                        onClick={() => onChange(id)}>
                        <TP size="1.5rem" weight={400}>
                            {name}
                        </TP>
                        {description && (
                            <TP size="1rem" color="subtitle">
                                {description}
                            </TP>
                        )}
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
    border: 1px solid ${p => (p.error ? p.theme.error : p.selected ? p.theme.gray(800) : p.theme.gray(200))};

    &:hover {
        border: 1px solid ${p => p.theme.gray(400)};
    }

    & > div {
        color: ${p => (p.selected ? p.theme.gray(1000) : p.theme.text.subtitle)};
    }
`; 