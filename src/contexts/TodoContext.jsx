import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadTodos, saveTodos } from '../utils/storage';

const TodoContext = createContext(null);

const todoReducer = (state, action) => {
  switch (action.type) {
    case 'INIT':
      return action.payload;

    case 'ADD':
      return [...state, action.payload];

    case 'UPDATE':
      return state.map(todo =>
        todo.id === action.payload.id ? action.payload : todo
      );

    case 'DELETE':
      return state.filter(todo => todo.id !== action.payload);

    case 'TOGGLE_STATUS':
      return state.map(todo => {
        if (todo.id === action.payload) {
          const statusMap = { todo: 'inprogress', inprogress: 'done', done: 'todo' };
          return {
            ...todo,
            status: statusMap[todo.status] || 'todo',
            updatedAt: new Date().toISOString()
          };
        }
        return todo;
      });

    case 'REORDER':
      return action.payload;

    default:
      return state;
  }
};

export const TodoProvider = ({ children }) => {
  const [todos, dispatch] = useReducer(todoReducer, []);

  useEffect(() => {
    const loadedTodos = loadTodos();
    dispatch({ type: 'INIT', payload: loadedTodos });
  }, []);

  useEffect(() => {
    if (todos.length > 0 || loadTodos().length > 0) {
      saveTodos(todos);
    }
  }, [todos]);

  const addTodo = (todoData) => {
    const newTodo = {
      id: crypto.randomUUID(),
      title: todoData.title,
      description: todoData.description || '',
      dueDate: todoData.dueDate,
      priority: todoData.priority || 2,
      status: todoData.status || 'todo',
      reminderTime: todoData.reminderTime || '',
      notifiedAt: null,
      order: todos.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD', payload: newTodo });
    return newTodo;
  };

  const updateTodo = (id, todoData) => {
    const existingTodo = todos.find(t => t.id === id);
    if (!existingTodo) return;

    const updatedTodo = {
      ...existingTodo,
      title: todoData.title,
      description: todoData.description || '',
      dueDate: todoData.dueDate,
      priority: todoData.priority || 2,
      status: todoData.status || 'todo',
      reminderTime: todoData.reminderTime || '',
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE', payload: updatedTodo });
  };

  const deleteTodo = (id) => {
    dispatch({ type: 'DELETE', payload: id });
  };

  const toggleStatus = (id) => {
    dispatch({ type: 'TOGGLE_STATUS', payload: id });
  };

  const getTodoById = (id) => {
    return todos.find(todo => todo.id === id);
  };

  const reorderTodos = (reorderedTodos) => {
    const todosWithOrder = reorderedTodos.map((todo, index) => ({
      ...todo,
      order: index,
      updatedAt: new Date().toISOString()
    }));
    dispatch({ type: 'REORDER', payload: todosWithOrder });
  };

  const markAsNotified = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = {
      ...todo,
      notifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE', payload: updatedTodo });
  };

  return (
    <TodoContext.Provider value={{
      todos,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleStatus,
      getTodoById,
      reorderTodos,
      markAsNotified
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within TodoProvider');
  }
  return context;
};
