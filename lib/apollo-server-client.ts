import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function makeServerClient() {
  if (!process.env.NEXT_PUBLIC_SNAPSHOT_API_URL)
    throw new Error("Snapshot URL is not defined");

  return new ApolloClient({
    ssrMode: true,
    link: new HttpLink({
      uri: `${process.env.NEXT_PUBLIC_SNAPSHOT_API_URL}/graphql`,
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}
