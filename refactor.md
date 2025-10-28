Here is a logical, step-by-step order to perform the refactoring.

This plan is designed to be incremental, testable, and safe. You start with the foundation, prove the new pattern on your simplest page, build the new feature using that pattern, and *then* tackle your most complex page.

### Phase 1: Foundation and Setup (The "Get Ready" Phase)

Your goal here is to set up the new structure and tools without breaking existing code.

1.  **Install Zustand:**
    * `npm install zustand` (or your package manager's equivalent).
2.  **Create New Folder Structure:**
    * Create the new directories from the plan:
        * `lib/`
        * `lib/api/`
        * `lib/stores/`
        * `hooks/`
        * `components/features/`
        * `components/features/project-gallery/`
        * `components/features/batch-viewer/`
        * `components/features/selection/`
3.  **Centralize API Client:**
    * Create `lib/api/client.ts`.
    * Move the `client.setConfig(...)` logic from `page.tsx` and `[batchId]/page.tsx` into this file.
    * Export the *single, configured* `client` instance from this file.
    * *From now on, all API calls will import this client, not the one from `client.gen.ts`.*
4.  **Centralize Query Definitions:**
    * Create `lib/api/queries.ts`.
    * Re-export all the React Query options you use from `@/client/@tanstack/react-query.gen.ts`. (e.g., `export { getAllBatchesOptions, getBatchOptions } from '@/client/@tanstack/react-query.gen.ts'`).
    * *This gives you a single "API" file for your entire frontend's data-fetching definitions.*

---

### Phase 2: Refactor the Projects Page (The "First Win")

Your goal is to refactor your simplest page (`/app/page.tsx`) to use the new "hook-driven" pattern. This proves the architecture works before you tackle the complex page.

1.  **Create Feature Components:**
    * Move the `ProjectCard` component logic from `app/page.tsx` into its own new file: `components/ui/ProjectCard.tsx`.
    * Move the `CreateProjectModal` component logic from `app/page.tsx` into `components/features/project-gallery/CreateProjectModal.tsx`.
2.  **Create the Logic Hook:**
    * Create `hooks/useProjectGallery.ts`.
    * Move all logic from `app/page.tsx` into this new hook:
        * The `useQuery(getAllBatchesOptions)` call.
        * The `useDisclosure` state for the modal.
        * The `createBatchMutation` logic.
        * All handlers (`handleSubmit`, `handleClose`, etc.).
    * The hook should return an object: `{ projects, isLoading, isModalOpen, onOpenModal, onCloseModal, ...etc }`.
3.  **Refactor the Page:**
    * Delete everything from `app/page.tsx` except the main JSX.
    * Call your new hook at the top: `const { projects, isLoading, ... } = useProjectGallery();`.
    * The page should now just be simple JSX that renders the `ProjectList` and `CreateProjectModal`, passing props from the hook.

---

### Phase 3: Implement the New Feature (The "Selection Store")

Your goal is to build the new selection feature *using the new architecture*. This is easier than refactoring old code.

1.  **Create the Global Store:**
    * Create `lib/stores/useImageSelectionStore.ts`.
    * Inside, define your Zustand store with:
        * **State:** `selectedImageIds: Set<number>`
        * **Actions:** `toggleImage(id)`, `clearSelection()`, `isImageSelected(id)`
2.  **Update `ImageCard`:**
    * Go to `components/ui/ImageCard.tsx`.
    * Have it subscribe to the store: `const { isImageSelected, toggleImage } = useImageSelectionStore();`
    * Get its selection state: `const isSelected = isImageSelected(image.id);`
    * Add a visual indicator (like a blue border or checkmark) based on the `isSelected` boolean.
    * The `onClick` handler (on the `div` wrapper in `ImageGrid`) should be moved to the `ImageCard` itself and call `toggleImage(image.id)`.
3.  **Create the Selection Toolbar:**
    * Create `components/features/selection/SelectionToolbar.tsx`.
    * This component will subscribe to `useImageSelectionStore`.
    * It will only render itself (e.g., as a floating bar) if `selectedImageIds.size > 0`.
    * Add a "Clear" button and a "X Selected" label. Add dummy buttons for "Delete" or "Move".

---

### Phase 4: Refactor the Batch Detail Page (The "Final Boss")

Your goal is to refactor the complex `app/batches/[batchId]/page.tsx` by breaking it apart into its logical pieces.

1.  **Create Local UI Store:**
    * You need a store for this page's *local* UI state (which image is in the detail panel, what is the view mode).
    * Create `components/features/batch-viewer/useBatchViewerStore.ts`.
    * Define a *local* Zustand store (using `createStore`, not `create`) that holds:
        * `view: 'all' | 'grouped'`
        * `detailImage: ImageResponse | null`
        * Actions: `setView(view)`, `setDetailImage(image)`, `closeDetailPanel()`
2.  **Create the Logic Hook:**
    * Create `hooks/useBatchViewer.ts`. This hook will be the "brain" of the page.
    * Inside this hook:
        * Get `batchId` from `useParams`.
        * Use the local store: `const store = useStore(useBatchViewerStore, ...)`
        * Fetch data: `const { data: batch, ... } = useQuery(getBatchOptions(...));`
        * Derive data: `const allImages = useMemo(...)`
        * Fetch metadata: `useQuery(getImageMetadataOptions(...), { enabled: !!store.detailImage?.id })`
        * Return everything: `{ batch, allImages, view, setView, detailImage, setDetailImage, ... }`
3.  **Move Feature Components:**
    * Move `ClusteringToolbox.tsx` to `components/features/batch-viewer/`.
    * Move `ImageGrid.tsx` to `components/features/batch-viewer/`.
    * Move `ImageDetailPanel.tsx` (and its children `MetadataDisplay`, `MetadataRow`) to `components/features/batch-viewer/ImageDetailPanel.tsx`.
4.  **Create the Main Component:**
    * Create `components/features/batch-viewer/BatchViewer.tsx`.
    * This component will:
        * Call `const { ... } = useBatchViewer();`
        * Render the 3-column layout (Toolbox, Grid, Detail Panel).
        * Render the `<SelectionToolbar />` component.
        * Pass all the props and handlers down to the child components.
5.  **Refactor the Page:**
    * Your `app/batches/[batchId]/page.tsx` file should now be tiny. It will just import and render `<BatchViewer />`.
    * At this point, your refactor is complete.