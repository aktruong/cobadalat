import styled from '@emotion/styled';
import { Stack } from '@/src/components/atoms';
import { ProductTile } from '@/src/components/molecules/ProductTile';
import { ProductSearchType } from '@/src/graphql/selectors';

const Grid = styled(Stack)`
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
    width: 100%;

    @media (min-width: ${p => p.theme.breakpoints.md}) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: ${p => p.theme.breakpoints.lg}) {
        grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: ${p => p.theme.breakpoints.xl}) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

interface ProductGridProps {
    products: ProductSearchType[];
    collections: any[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, collections }) => {
    return (
        <Grid>
            {products?.map(product => (
                <ProductTile key={product.slug} product={product} collections={collections} />
            ))}
        </Grid>
    );
}; 