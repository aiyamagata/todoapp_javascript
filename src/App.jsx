import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TodoProvider, useTodos } from './contexts/TodoContext';
import { useNotifications } from './hooks/useNotifications';
import TodoList from './pages/TodoList';
import TodoForm from './pages/TodoForm';
import './App.css';

function AppContent() {
  const { todos, markAsNotified } = useTodos();
  useNotifications(todos, markAsNotified);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<TodoList />} />
          <Route path="/new" element={<TodoForm />} />
          <Route path="/edit/:id" element={<TodoForm />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  );
}

export default App;
