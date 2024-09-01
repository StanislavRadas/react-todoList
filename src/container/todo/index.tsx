import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './index.css';
import plus from '../todo/icon/plus.svg';

const API_URL = 'https://66d333a2184dce1713cf971b.mockapi.io/listData/listData';

interface listData {
  id: string;
  complete: boolean;
  title: string;
}

export function BoxBasic({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="section"
      sx={{
        p: 3,
        border: '1px solid grey',
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {children}
    </Box>
  );
}

export function CheckboxList({
  tasks,
  onToggle,
  onUpdate,
  onDelete,
}: {
  tasks: listData[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEditClick = (task: listData) => {
    setEditTaskId(task.id);
    setEditValue(task.title);
  };

  const handleUpdateTask = () => {
    if (editTaskId && editValue.trim() !== '') {
      onUpdate(editTaskId, editValue);
      setEditTaskId(null);
      setEditValue('');
    }
  };

  return (
    <List sx={{ display: 'flex', flexDirection: 'column' }}>
      {tasks.map((task) => {
        const labelId = `checkbox-list-label-${task.id}`;

        return (
          <ListItem key={task.id} disablePadding>
            <ListItemButton
              role={undefined}
              dense
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.complete}
                  onClick={() => onToggle(task.id)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                {editTaskId === task.id ? (
                  <TextField
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleUpdateTask}
                    autoFocus
                    size="small"
                    sx={{ marginRight: '8px' }}
                  />
                ) : (
                  <ListItemText id={labelId} primary={task.title} />
                )}
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                        if (editTaskId === task.id) {
                            handleUpdateTask();
                        } else {
                            handleEditClick(task);
                        }
                        }}
                    >
                        {editTaskId === task.id ? 'Save' : 'Edit'}
                    </Button>
                    {editTaskId !== task.id && (
                        <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        >
                        Delete
                        </Button>
                    )}
                </Box>
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

const Todo: React.FC = () => {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const { data: tasks = [], isLoading, isError, error } = useQuery<listData[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          console.error('Network response was not ok', response.statusText);
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched tasks:', data);
        return data;
      } catch (err) {
        console.error('Error fetching tasks:', err);
        throw err;
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (newTask: Omit<listData, 'id'>) =>
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (task: listData) =>
      fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (task: listData) =>
      fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleAddTask = () => {
    if (inputValue.trim() !== '') {
      addTaskMutation.mutate({ title: inputValue, complete: false });
      setInputValue('');
    }
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find((t: listData) => t.id === id);
    if (task) {
      toggleTaskMutation.mutate({ ...task, complete: !task.complete });
    }
  };

  const handleUpdateTask = (id: string, title: string) => {
    const task = tasks.find((t: listData) => t.id === id);
    if (task) {
      updateTaskMutation.mutate({ ...task, title });
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  const reversedTasks = [...tasks].reverse();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div className="page">
      <div className="page__block">
        <BoxBasic>
          <header className="header">
            <p className="title">To Do List</p>
            <div className="input__block">
              <input
                className="input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Please type your task..."
              />
              <img
                className="icon"
                src={plus}
                alt="plus"
                width={28}
                height={28}
                onClick={handleAddTask}
              />
            </div>
          </header>
          <div className="divider"></div>
          <CheckboxList
            tasks={reversedTasks || []}
            onToggle={handleToggleTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </BoxBasic>
      </div>
    </div>
  );
};

export default Todo;