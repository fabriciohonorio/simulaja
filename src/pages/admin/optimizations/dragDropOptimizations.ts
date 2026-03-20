export const improvedOnDragEnd = (result) => {
    const { destination, source } = result;

    // Check if the destination and source are the same, no need to reorder
    if (!destination) {
        return;
    }

    if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
    ) {
        return;
    }

    // Add logic to handle the reordering of items here
    // E.g., updating state or calling a function to reorder
    // Further optimization can be added based on specific requirements
};
