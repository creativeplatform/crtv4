import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function makeServerClient() {
  if (!process.env.NEXT_PUBLIC_API_URL)
    throw new Error("NEXT_PUBLIC_API_URL is not defined");

  return new ApolloClient({
    ssrMode: true,
    link: new HttpLink({
      uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}
