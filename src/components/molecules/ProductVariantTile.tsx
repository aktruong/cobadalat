import { Stack, Link, TP } from '@/src/components/atoms/';
import { ProductVariantTileType } from '@/src/graphql/selectors';
import { priceFormatter } from '@/src/util/priceFormatter';
import styled from '@emotion/styled';
import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useCart } from '@/src/state/cart';

export const ProductVariantTile: React.FC<{
    product: ProductVariantTileType;
    lazy?: boolean;
}> = ({ product, lazy }) => {
    const { t } = useTranslation('common');
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(product.id, 1, true);
    };

    return (
        <Main column gap="1rem">
            <Link href={`/products/${product.product.slug}/`}>
                <ImageWrapper>
                    <Image
                        src={product.featuredAsset?.preview || '/images/placeholder.png'}
                        alt={product.name}
                        width={300}
                        height={300}
                        loading={lazy ? 'lazy' : 'eager'}
                        style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover'
                        }}
                    />
                </ImageWrapper>
            </Link>
            <Stack column gap="0.25rem">
                <Stack column gap="0.5rem">
                    <Link href={`/products/${product.product.slug}/`}>
                        <ProductName>{product.name}</ProductName>
                    </Link>
                </Stack>
                <ProductPrice gap="0.25rem">
                    <ProductPriceValue>{priceFormatter(product.priceWithTax, product.currencyCode)}</ProductPriceValue>
                    <AddToCartButton onClick={handleAddToCart}>
                        Thêm
                    </AddToCartButton>
                </ProductPrice>
            </Stack>
        </Main>
    );
};

const ImageWrapper = styled.div`
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    background: ${p => p.theme.gray(100)};

    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const ProductName = styled.div`
    font-weight: 700;
    color: ${p => p.theme.gray(900)};
    font-size: 2.25rem;
`;

const ProductPrice = styled(Stack)`
    font-size: 1.875rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ProductPriceValue = styled(Stack)`
    font-weight: 600;
`;

const Main = styled(Stack)`
    font-size: 2.25rem;
    position: relative;
    width: 100%;
    font-weight: 500;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    padding: 1.5rem;
    background-color: ${p => p.theme.gray(0)};
    
    &:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
    }

    @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
        max-width: 35.5rem;
    }
`;

const AddToCartButton = styled.button`
    background-color: #1877F2;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-size: 1.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 8rem;
    
    &:hover {
        background-color: #166FE5;
        transform: translateY(-1px);
    }
    
    &:active {
        transform: translateY(0);
    }

    @media (max-width: ${p => p.theme.breakpoints.sm}) {
        padding: 1rem 2rem;
        font-size: 2rem;
        min-width: 10rem;
    }
`;
