# Search Architecture Improvements

## Current Implementation

The current search implementation has several inefficiencies:

1. **Client-Server Data Flow**:
   - The server initially sends ALL WODs to the client
   - The client then makes a separate API call to filter those WODs based on the search term
   - This causes a flash effect - first showing all WODs, then showing filtered results (or no results)

2. **Double Filtering**:
   - Search results from the server are filtered again on the client side
   - This can lead to inconsistencies and unexpected behavior

3. **Race Conditions**:
   - Multiple state updates can cause race conditions where newer state overwrites older state
   - This can lead to flickering UI and inconsistent results

## Proposed Improvements

### 1. Server-Side Search with Initial Render

**Goal**: Pass search parameters from the URL to the server during the initial render and only return matching WODs.

**Implementation**:
```typescript
// In page.tsx
export default async function Home({ searchParams }: { searchParams: { search?: string } }): Promise<JSX.Element> {
  // Extract search query from URL
  const searchQuery = searchParams.search || '';
  
  // Fetch WODs server-side with the search query
  const initialWodsRaw = await api.wod.getAll({ searchQuery });
  
  // Validate and transform raw data
  const parseResult = WodSchema.array().safeParse(initialWodsRaw);
  let initialWods: Wod[] = [];
  if (parseResult.success) {
    initialWods = parseResult.data as Wod[];
  }
  
  // Hydrate React Query cache
  const queryClient = new QueryClient();
  await queryClient.setQueryData(["wod.getAll", { input: { searchQuery }, type: "query" }], initialWodsRaw);
  const dehydratedState = dehydrate(queryClient);
  
  return (
    <PageLayout>
      <ReactQueryProvider dehydratedState={dehydratedState}>
        <WodViewer initialWods={initialWods} initialSearchTerm={searchQuery} />
      </ReactQueryProvider>
    </PageLayout>
  );
}
```

**Benefits**:
- Eliminates the flash effect
- Reduces the amount of data transferred to the client
- Improves performance by not rendering unnecessary WODs
- Provides a better user experience with immediate relevant results

### 2. Conditional Fetching Strategy

**Goal**: Optimize data fetching based on search state.

**Implementation**:
```typescript
// In WodViewer.tsx
const {
  data: wodsDataFromHook,
  isLoading: isLoadingWods,
  error: errorWods,
} = api.wod.getAll.useQuery(
  searchTerm ? { searchQuery: searchTerm } : {},
  {
    staleTime: 5 * 60 * 1000,
  }
);
```

**Benefits**:
- If search term is empty, fetch all WODs
- If search term exists, fetch only filtered results
- When search is cleared, the query is re-executed to fetch all WODs again

### 3. Paginated Approach

**Goal**: Reduce data load and improve performance with pagination.

**Implementation**:
```typescript
// In wod.ts router
getAll: publicProcedure
  .input(
    z.object({
      searchQuery: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Fetch total count for pagination
    const totalCount = await ctx.db
      .select({ count: sql`count(*)` })
      .from(wods)
      .where(/* search conditions */);
      
    // Fetch paginated WODs
    const paginatedWods = await ctx.db
      .select()
      .from(wods)
      .where(/* search conditions */)
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);
      
    // Process and return results
    return {
      wods: processWods(paginatedWods),
      pagination: {
        totalCount: totalCount[0].count,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(totalCount[0].count / input.pageSize),
      }
    };
  });
```

**Benefits**:
- Always fetch data in pages (e.g., 20-50 WODs at a time)
- For searches, fetch filtered results with the same pagination
- When search is cleared, fetch the first page of all WODs
- This reduces the initial data load and provides better performance

## Implementation Priority

1. **Fix the current server-side search implementation** to ensure multi-word searches work correctly
2. Implement the **conditional fetching strategy** as it's the simplest improvement with the current architecture
3. Implement **server-side search with initial render** for a better user experience
4. Add **pagination** for improved performance with large datasets

## Technical Considerations

1. **URL State Management**:
   - Ensure all search parameters are reflected in the URL
   - This enables sharing search results and browser history navigation

2. **Caching Strategy**:
   - Use React Query's caching capabilities to avoid unnecessary refetches
   - Consider cache invalidation strategies for data updates

3. **Error Handling**:
   - Implement robust error handling for search failures
   - Provide meaningful error messages to users

4. **Performance Monitoring**:
   - Add metrics to track search performance
   - Monitor client and server response times for searches
