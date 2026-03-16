import React, { useCallback, useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import MemoLeadCard from './MemoLeadCard';

const Funil = ({ columns }) => {
    const getColumnLeads = useCallback((columnId) => {
        return columns[columnId].leads;
    }, [columns]);

    const onDragEnd = async (result) => {
        // Fire-and-forget logic here (e.g., updating the state or sending an API request)
        await updateLeadPosition(result);
    };

    return (
        <div>
            {Object.keys(columns).map(columnId => {
                const leads = getColumnLeads(columnId);
                return (
                    <Droppable droppableId={columnId} key={columnId}>
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {leads.map((lead, index) => (
                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                        {(provided) => (
                                            <MemoLeadCard lead={lead} innerRef={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} />
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                );
            })}
        </div>
    );
};

export default Funil;