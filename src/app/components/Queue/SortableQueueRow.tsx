"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripLines } from "@fortawesome/free-solid-svg-icons";

interface SortableQueueRowProps {
    id: string;
    disabled?: boolean;
    editing?: boolean;
    children: (isDragging: boolean) => ReactNode;
}

export default function SortableQueueRow({
    id,
    disabled = false,
    editing = false,
    children,
}: SortableQueueRowProps) {
    const {
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    return (
        <div
            ref={setNodeRef}
            data-editing={editing && !disabled}
            data-handle={!disabled}
            style={{
                zIndex: isDragging ? 30 : undefined,
                transform: CSS.Translate.toString(transform),
                transition: transition
                    ? `${transition}, scale 150ms ease`
                    : "scale 150ms ease",
            }}
            className={`group/row relative w-fit select-none ${isDragging ? "scale-[1.03] drop-shadow-2xl" : ""
                }`}
        >
            {children(isDragging)}

            {!disabled && (
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    aria-label="Reorder"
                    {...listeners}
                    className={`absolute right-1 top-1/2 z-10 flex h-10 w-8 -translate-y-1/2 touch-none items-center justify-center rounded-lg text-white/70 transition-opacity duration-150 hover:text-white 
                        ${editing || isDragging
                            ? `pointer-events-auto opacity-100 
                                ${isDragging
                                ? "cursor-grabbing"
                                : "cursor-grab"
                            }`
                            : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:cursor-grab group-hover/row:opacity-100"
                        }`
                    }
                >
                    <FontAwesomeIcon icon={faGripLines} className="text-sm" />
                </button>
            )}
        </div>
    );
}