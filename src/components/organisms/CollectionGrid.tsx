import styled from '@emotion/styled';
import { Stack, TH1 } from '@/src/components/atoms';
import { ProductTile } from '@/src/components/molecules/ProductTile';
import { CollectionTileType } from '@/src/graphql/selectors';
import Link from 'next/link';

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

const CollectionSection = styled(Stack)`
    width: 100%;
    gap: 2rem;
    margin-bottom: 4rem;
`;

const CollectionTitle = styled(TH1)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    text-transform: uppercase;
    font-size: 2.2rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase !important;
`;

const CollectionName = styled.span`
    text-transform: uppercase;
`;

const SeeAllLink = styled(Link)`
    font-size: 1.4rem;
    color: ${p => p.theme.text.main};
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

interface CollectionGridProps {
    collections: CollectionTileType[];
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({ collections }) => {
    return (
        <>
            {collections.map(collection => (
                <CollectionSection key={collection.id} column>
                    <CollectionTitle>
                        <CollectionName>{collection.name}</CollectionName>
                        <SeeAllLink href={`/collections/${collection.slug}`}>
                            Xem tất cả
                        </SeeAllLink>
                    </CollectionTitle>
                    <Grid>
                        {collection.productVariants?.items.map(product => (
                            <ProductTile 
                                key={product.slug} 
                                product={product} 
                                collections={collections} 
                            />
                        ))}
                    </Grid>
                </CollectionSection>
            ))}
        </>
    );
}; 