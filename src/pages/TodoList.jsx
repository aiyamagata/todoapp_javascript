import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTodos } from '../contexts/TodoContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TodoList.css';

const DragHandle = () => (
  <svg
    className="drag-handle"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="5" r="1.5" fill="currentColor" />
    <circle cx="13" cy="5" r="1.5" fill="currentColor" />
    <circle cx="7" cy="10" r="1.5" fill="currentColor" />
    <circle cx="13" cy="10" r="1.5" fill="currentColor" />
    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
    <circle cx="13" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

const NotificationIcon = ({ status }) => {
  if (status === 'notified') {
    return (
      <svg
        className="notification-icon notified"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        title="通知済み"
      >
        <path
          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (status === 'missed') {
    return (
      <svg
        className="notification-icon missed"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        title="通知時刻を過ぎています"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (status === 'scheduled') {
    return (
      <svg
        className="notification-icon scheduled"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        title="通知予定"
      >
        <path
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return null;
};

const getNotificationStatus = (todo) => {
  if (!todo.reminderTime) return null;

  if (todo.notifiedAt) return 'notified';

  const now = new Date();
  const todoDate = new Date(todo.dueDate);
  const isToday =
    todoDate.getDate() === now.getDate() &&
    todoDate.getMonth() === now.getMonth() &&
    todoDate.getFullYear() === now.getFullYear();

  if (!isToday) {
    const isPast = todoDate < now;
    if (isPast) return 'missed';
    return 'scheduled';
  }

  const [hours, minutes] = todo.reminderTime.split(':').map(Number);
  const reminderDateTime = new Date(todoDate);
  reminderDateTime.setHours(hours, minutes, 0, 0);

  if (now > reminderDateTime) return 'missed';

  return 'scheduled';
};

const SortableTodoCard = ({ todo, onToggleStatus, onDelete, priorityLabels, statusLabels, formatDate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const notificationStatus = getNotificationStatus(todo);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`todo-card status-${todo.status}`}
    >
      <div className="card-header">
        <div className="card-title-section">
          <div className="drag-handle-wrapper" {...attributes} {...listeners}>
            <DragHandle />
          </div>
          <input
            type="checkbox"
            checked={todo.status === 'done'}
            onChange={() => onToggleStatus(todo.id)}
            className="todo-checkbox"
            id={`todo-${todo.id}`}
          />
          <label htmlFor={`todo-${todo.id}`} className="todo-title">
            {todo.title}
          </label>
        </div>
        <div className="card-meta">
          {notificationStatus && <NotificationIcon status={notificationStatus} />}
          <span className={`priority-badge priority-${todo.priority}`}>
            {priorityLabels[todo.priority]}
          </span>
          <span className={`status-badge status-${todo.status}`}>
            {statusLabels[todo.status]}
          </span>
        </div>
      </div>

      {todo.description && (
        <p className="todo-description">{todo.description}</p>
      )}

      <div className="card-footer">
        <div className="todo-date">
          期日: {formatDate(todo.dueDate)}
          {todo.reminderTime && (
            <span className="reminder-time"> | 通知: {todo.reminderTime}</span>
          )}
        </div>
        <div className="card-actions">
          <Link to={`/edit/${todo.id}`} className="btn btn-secondary btn-small">
            編集
          </Link>
          <button
            onClick={() => onDelete(todo.id, todo.title)}
            className="btn btn-danger btn-small"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

const TodoList = () => {
  const { todos, toggleStatus, deleteTodo, reorderTodos } = useTodos();
  const [sortBy, setSortBy] = useState('manual');
  const [filterStatus, setFilterStatus] = useState('all');

  const priorityLabels = { 1: '高', 2: '中', 3: '低' };
  const statusLabels = { todo: '未開始', inprogress: '進行中', done: '完了' };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getSortedTodos = () => {
    let filtered = todos;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(todo => todo.status === filterStatus);
    }

    if (sortBy === 'manual') {
      return [...filtered].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        return orderA - orderB;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate-asc':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'dueDate-desc':
          return new Date(b.dueDate) - new Date(a.dueDate);
        case 'priority-asc':
          return a.priority - b.priority;
        case 'priority-desc':
          return b.priority - a.priority;
        case 'createdAt-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`「${title}」を削除しますか？`)) {
      deleteTodo(id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleStatus(id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedTodos.findIndex((todo) => todo.id === active.id);
      const newIndex = sortedTodos.findIndex((todo) => todo.id === over.id);

      const reordered = arrayMove(sortedTodos, oldIndex, newIndex);
      reorderTodos(reordered);
    }
  };

  const sortedTodos = getSortedTodos();
  const statusCounts = {
    all: todos.length,
    todo: todos.filter(t => t.status === 'todo').length,
    inprogress: todos.filter(t => t.status === 'inprogress').length,
    done: todos.filter(t => t.status === 'done').length
  };

  const isDragDisabled = sortBy !== 'manual';

  return (
    <div className="todo-list-page">
      <header className="page-header">
        <h1>Todoリスト</h1>
        <Link to="/new" className="btn btn-primary">
          新規作成
        </Link>
      </header>

      {todos.length === 0 ? (
        <div className="empty-state">
          <p>Todoがありません</p>
          <Link to="/new" className="btn btn-primary">
            最初のTodoを作成
          </Link>
        </div>
      ) : (
        <>
          <div className="controls-section">
            <div className="filter-section">
              <h3>ステータス</h3>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  すべて ({statusCounts.all})
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'todo' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('todo')}
                >
                  未開始 ({statusCounts.todo})
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'inprogress' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('inprogress')}
                >
                  進行中 ({statusCounts.inprogress})
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'done' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('done')}
                >
                  完了 ({statusCounts.done})
                </button>
              </div>
            </div>

            <div className="sort-section">
              <label htmlFor="sortBy">ソート:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="manual">手動並び替え</option>
                <option value="dueDate-asc">期日（昇順）</option>
                <option value="dueDate-desc">期日（降順）</option>
                <option value="priority-asc">優先度（高→低）</option>
                <option value="priority-desc">優先度（低→高）</option>
                <option value="createdAt-desc">作成日（新しい順）</option>
              </select>
            </div>
          </div>

          {isDragDisabled && (
            <div className="drag-disabled-notice">
              ドラッグ&ドロップで並び替えるには「手動並び替え」を選択してください
            </div>
          )}

          {sortedTodos.length === 0 ? (
            <div className="no-results">
              <p>条件に合うTodoはありません</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedTodos.map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
                disabled={isDragDisabled}
              >
                <div className="todo-list">
                  {sortedTodos.map(todo => (
                    <SortableTodoCard
                      key={todo.id}
                      todo={todo}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                      priorityLabels={priorityLabels}
                      statusLabels={statusLabels}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
};

export default TodoList;
