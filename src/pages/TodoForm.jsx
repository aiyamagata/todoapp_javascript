import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTodos } from '../contexts/TodoContext';
import './TodoForm.css';

const TodoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addTodo, updateTodo, getTodoById } = useTodos();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: '2',
    status: 'todo',
    reminderTime: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const todo = getTodoById(id);
      if (todo) {
        setFormData({
          title: todo.title,
          description: todo.description || '',
          dueDate: todo.dueDate || '',
          priority: String(todo.priority || 2),
          status: todo.status || 'todo',
          reminderTime: todo.reminderTime || ''
        });
      } else {
        navigate('/');
      }
    }
  }, [id, isEdit, getTodoById, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = '期日は必須です';
    }

    if (!formData.priority) {
      newErrors.priority = '優先度は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const todoData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate,
      priority: parseInt(formData.priority, 10),
      status: formData.status,
      reminderTime: formData.reminderTime
    };

    if (isEdit) {
      updateTodo(id, todoData);
    } else {
      addTodo(todoData);
    }

    navigate('/');
  };

  return (
    <div className="todo-form-page">
      <header className="page-header">
        <h1>{isEdit ? 'Todo編集' : '新規Todo作成'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="todo-form">
        <div className="form-group">
          <label htmlFor="title">
            タイトル <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? 'error' : ''}
            placeholder="Todoのタイトルを入力"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">説明</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="詳細な説明（任意）"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate">
              期日 <span className="required">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={errors.dueDate ? 'error' : ''}
            />
            {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reminderTime">通知時刻</label>
            <input
              type="time"
              id="reminderTime"
              name="reminderTime"
              value={formData.reminderTime}
              onChange={handleChange}
              placeholder="HH:MM"
            />
            <span className="field-hint">期日当日にこの時刻に通知します</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">
              優先度 <span className="required">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={errors.priority ? 'error' : ''}
            >
              <option value="">選択してください</option>
              <option value="1">高（1）</option>
              <option value="2">中（2）</option>
              <option value="3">低（3）</option>
            </select>
            {errors.priority && <span className="error-message">{errors.priority}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">ステータス</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="todo">未開始</option>
              <option value="inprogress">進行中</option>
              <option value="done">完了</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEdit ? '更新' : '作成'}
          </button>
          <Link to="/" className="btn btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
