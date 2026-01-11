import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onOpenChecklist,
  isDragging = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const totalChecklist = task.checklist?.length ?? 0;
  const completedChecklist =
    task.checklist?.filter((item) => item.isCompleted).length ?? 0;
  const checklistProgress =
    totalChecklist > 0
      ? Math.round((completedChecklist / totalChecklist) * 100)
      : 0;
  const checklistPreview = (task.checklist ?? []).slice(0, 3);

  const handleOpenChecklist = () => {
    onOpenChecklist?.(task);
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={(event) => {
        // If the card menu is open (or we're dragging), don't trigger edit.
        if (isDragging || Boolean(anchorEl)) return;
        // If user clicked an action button inside the card, don't trigger edit.
        if (event?.target?.closest?.("[data-task-action]")) return;
        onEdit?.(task);
      }}
      onKeyDown={(event) => {
        if (isDragging || Boolean(anchorEl)) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit?.(task);
        }
      }}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundImage: (theme) =>
          task.isCompleted
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.16
              )} 0%, ${alpha(theme.palette.success.main, 0.05)} 55%, ${alpha(
                theme.palette.success.main,
                0
              )} 100%)`
            : "none",
        borderColor: (theme) =>
          task.isCompleted
            ? alpha(theme.palette.success.main, 0.35)
            : theme.palette.divider,
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 18px 30px rgba(15, 23, 42, 0.35)"
            : "0 18px 28px rgba(15, 23, 42, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {task.title}
          </Typography>
          {task.dueDate ? (
            <Typography variant="caption" color="text.secondary">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </Typography>
          ) : null}
          {(task.estimatedHours ?? task.EstimatedHours) ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Est. {task.estimatedHours ?? task.EstimatedHours}h
            </Typography>
          ) : null}
          {(task.actualHours ?? task.ActualHours) ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Actual {task.actualHours ?? task.ActualHours}h
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box component="span" data-task-action="menu" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                handleMenuOpen(event);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </Stack>
      {task.description ? (
        <Typography variant="body2" color="text.secondary">
          {task.description}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
          <>
            {task.assignees.slice(0, 3).map((assignee) => (
              <Chip
                key={assignee.memberId}
                size="small"
                label={assignee.name}
              />
            ))}
            {task.assignees.length > 3 && (
              <Chip
                size="small"
                label={`+${task.assignees.length - 3} more`}
                variant="outlined"
              />
            )}
          </>
        ) : task.assignedToName ? (
          <Chip size="small" label={task.assignedToName} />
        ) : (
          <Chip
            size="small"
            label="Unassigned"
            variant="outlined"
            color="default"
          />
        )}
      </Stack>
      {totalChecklist > 0 ? (
        <Box
          role="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenChecklist();
          }}
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "action.hover",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            "&:hover": {
              bgcolor: "action.selected",
            },
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChecklistOutlinedIcon
                fontSize="small"
                color={checklistProgress === 100 ? "success" : "primary"}
              />
              <Typography variant="caption" color="text.secondary">
                {completedChecklist}/{totalChecklist} completed •{" "}
                {checklistProgress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={checklistProgress}
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: "action.disabledBackground",
              }}
            />
            <Stack spacing={0.5}>
              {checklistPreview.map((item) => (
                <Stack
                  key={item.checklistItemId ?? item.title}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  {item.isCompleted ? (
                    <CheckCircleOutlineIcon
                      fontSize="small"
                      color="success"
                    />
                  ) : (
                    <RadioButtonUncheckedIcon
                      fontSize="small"
                      color="disabled"
                    />
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textDecoration: item.isCompleted
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {item.title}
                  </Typography>
                </Stack>
              ))}
              {totalChecklist > checklistPreview.length ? (
                <Typography variant="caption" color="text.secondary">
                  +{totalChecklist - checklistPreview.length} more
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={(event) => {
            event.stopPropagation();
            handleOpenChecklist();
          }}
          sx={{ alignSelf: "flex-start", mt: 1 }}
        >
          Add Checklist
        </Button>
      )}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleMenuClose();
            onEdit(task);
          }}
        >
          Edit Task
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleMenuClose();
            handleOpenChecklist();
          }}
        >
          View Checklist
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleMenuClose();
            onDelete(task);
          }}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

const TaskKanbanBoard = ({
  columns = [],
  onMoveTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenChecklist,
  onRenameColumn,
  onDeleteColumn,
}) => {
  const [boardState, setBoardState] = useState(columns);
  const [columnMenu, setColumnMenu] = useState({ anchor: null, column: null });

  useEffect(() => {
    setBoardState(columns);
  }, [columns]);

  const normalizedColumns = useMemo(
    () =>
      (boardState ?? [])
        .filter(
          (column) =>
            column &&
            column.columnId !== null &&
            column.columnId !== undefined
        )
        .map((column) => {
          const resolvedName =
            column.name ??
            column.title ??
            (typeof column.columnOrder === "number"
              ? `Column ${column.columnOrder + 1}`
              : "Column");

          return {
            ...column,
            displayName: resolvedName,
            cards: Array.isArray(column.cards) ? column.cards : [],
          };
        }),
    [boardState]
  );

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnIndex = normalizedColumns.findIndex(
      (column) => column.columnId.toString() === source.droppableId
    );
    const destinationColumnIndex = normalizedColumns.findIndex(
      (column) => column.columnId.toString() === destination.droppableId
    );

    const sourceColumn = normalizedColumns[sourceColumnIndex];
    const destinationColumn = normalizedColumns[destinationColumnIndex];

    if (!sourceColumn || !destinationColumn) {
      return;
    }

    const updatedSourceCards = Array.from(sourceColumn.cards);
    const [movedTask] = updatedSourceCards.splice(source.index, 1);

    const updatedDestinationCards =
      sourceColumn.columnId === destinationColumn.columnId
        ? updatedSourceCards
        : Array.from(destinationColumn.cards);

    updatedDestinationCards.splice(destination.index, 0, movedTask);

    const newState = [...normalizedColumns];
    newState[sourceColumnIndex] = {
      ...sourceColumn,
      cards:
        sourceColumn.columnId === destinationColumn.columnId
          ? updatedDestinationCards
          : updatedSourceCards,
    };
    newState[destinationColumnIndex] = {
      ...destinationColumn,
      cards: updatedDestinationCards,
    };

    setBoardState(newState);

    if (onMoveTask) {
      await onMoveTask({
        taskId: Number(draggableId),
        targetColumnId: destinationColumn.columnId,
        targetRowOrder: destination.index,
      });
    }
  };

  const gridTemplate = useMemo(
    () => ({
      display: "grid",
      gap: 2,
      gridTemplateColumns: {
        xs: "repeat(1, minmax(0, 1fr))",
        md: "repeat(2, minmax(0, 1fr))",
        lg: `repeat(${Math.min(normalizedColumns.length, 4)}, minmax(280px, 1fr))`,
        xl: `repeat(${normalizedColumns.length}, minmax(280px, 1fr))`,
      },
      alignItems: "flex-start",
    }),
    [normalizedColumns.length]
  );

  const openColumnMenu = (event, column) => {
    setColumnMenu({ anchor: event.currentTarget, column });
  };

  const closeColumnMenu = () => {
    setColumnMenu({ anchor: null, column: null });
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={gridTemplate}>
          {normalizedColumns.map((column) => (
            <Droppable droppableId={column.columnId.toString()} key={column.columnId}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    bgcolor: "background.default",
                    borderRadius: 3,
                    p: 2,
                    minHeight: 400,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {column.displayName}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${column.cards.length}${
                            column.workInProgressLimit ? `/${column.workInProgressLimit}` : ""
                          }`}
                        />
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onAddTask?.(column)}
                      >
                        Add
                      </Button>
                      <IconButton size="small" onClick={(event) => openColumnMenu(event, column)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Stack spacing={1.5} flexGrow={1}>
                    {column.cards.map((card, index) => (
                      <Draggable
                        draggableId={card.taskId.toString()}
                        index={index}
                        key={card.taskId}
                      >
                        {(dragProvided, snapshot) => (
                          <Box
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            sx={{
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              transform: snapshot.isDragging ? "rotate(-1deg)" : "none",
                            }}
                          >
                            <TaskCard
                              task={card}
                              isDragging={snapshot.isDragging}
                              onEdit={onEditTask}
                              onDelete={(task) => onDeleteTask?.(task)}
                              onOpenChecklist={onOpenChecklist}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                </Box>
              )}
            </Droppable>
          ))}
        </Box>
      </DragDropContext>
      <Menu
        anchorEl={columnMenu.anchor}
        open={Boolean(columnMenu.anchor)}
        onClose={closeColumnMenu}
      >
        <MenuItem
          onClick={() => {
            const column = columnMenu.column;
            closeColumnMenu();
            onRenameColumn?.(column);
          }}
        >
          Rename Column
        </MenuItem>
        <MenuItem
          onClick={() => {
            const column = columnMenu.column;
            closeColumnMenu();
            onDeleteColumn?.(column);
          }}
          sx={{ color: "error.main" }}
        >
          Delete Column
        </MenuItem>
      </Menu>
    </>
  );
};

export default TaskKanbanBoard;

