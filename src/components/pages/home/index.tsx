import styled from '@emotion/styled';
import { InferGetStaticPropsType } from 'next';
import React from 'react';
import { useTranslation } from 'next-i18next';
import { Stack, ContentContainer, TH1, Link } from '@/src/components/atoms';
import { HomePageSliders } from '@/src/components/organisms/HomePageSliders';
import { ProductTile } from '@/src/components/molecules/ProductTile';
import { Layout } from '@/src/layouts';
import type { getStaticProps } from './props';

const Main = styled(Stack)`
    padding: 0 0 4rem 0;
    background-color: ${p => p.theme.gray(50)};
`;

const Section = styled(Stack)`
    width: 100%;
    flex-direction: column;
    gap: 2rem;
`;

const ProductGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    
    @media (min-width: ${p => p.theme.breakpoints.md}) {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
    
    @media (min-width: ${p => p.theme.breakpoints.lg}) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

const CollectionHeader = styled(Stack)`
    justify-content: space-between;
    align-items: center;
`;

const SeeAllButton = styled(Link)`
    color: ${p => p.theme.gray(900)};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
        text-decoration: underline;
    }
`;

export const Home: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = props => {
    const { t } = useTranslation('homepage');

    return (
        <Layout navigation={props.navigation} categories={props.collections} pageTitle={t('seo.home')}>
            <Main w100 column gap="4rem">
                <ContentContainer>
                    <HomePageSliders sliders={props.sliders} seeAllText={t('see-all')} />
                </ContentContainer>
                {props.collections.map(collection => (
                    <ContentContainer key={collection.id}>
                        <Section>
                            <CollectionHeader>
                                <TH1>{collection.name}</TH1>
                                <SeeAllButton href={`/collections/${collection.slug}`}>
                                    {t('see-all')}
                                </SeeAllButton>
                            </CollectionHeader>
                            <ProductGrid>
                                {collection.products?.map(product => (
                                    <ProductTile 
                                        key={product.slug} 
                                        product={product} 
                                        collections={props.collections} 
                                    />
                                ))}
                            </ProductGrid>
                        </Section>
                    </ContentContainer>
                ))}
            </Main>
        </Layout>
    );
};
