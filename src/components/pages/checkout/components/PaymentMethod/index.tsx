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
    const handleSelect = (id: string) => {
        onChange(id);
    };

    return (
        <Stack w100 column>
            <Wrapper>
                {paymentMethods?.map(({ id, name, description }) => (
                    <Box
                        justifyCenter
                        itemsCenter
                        w100
                        error={!!error}
                        selected={selected === id}
                        key={id}
                        column
                        onClick={() => handleSelect(id)}>
                        <TP size="3rem" weight={400}>
                            {name}
                        </TP>
                        {description && (
                            <TP 
                                size="2rem" 
                                color="subtitle"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        )}
                    </Box>
                ))}
            </Wrapper>
        </Stack>
    );
};

const Wrapper = styled.div`
    margin: 1.6rem 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Box = styled(Stack)<{ selected: boolean; error: boolean }>`
    cursor: pointer;
    padding: 2rem;
    border: 1px solid ${p => (p.error ? p.theme.error : p.selected ? '#1877F2' : p.theme.gray(200))};
    width: 100%;
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
`; 