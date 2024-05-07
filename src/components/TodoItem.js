import React from "react";

const TodoItem = ({ todo, onToggle, onDelete }) => {
  return (
    <li className="flex items-center justify-between p-2 mb-2 bg-gray-100 rounded text-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)} // todo 객체 대신 todo.id를 전달
        className="form-checkbox h-5 w-5 text-blue-600"
      />
      <span
        className={`flex-1 ml-2 ${todo.completed ? "line-through" : ""}`}
      >
        {todo.text}
      </span>
      <span className="mr-2 text-blue-500">
        {todo.date}
      </span>
      <span className="mr-2 text-green-500">
        {todo.label || "분류되지 않음"}
      </span>
      <button
        className="text-white p-1 rounded hover:bg-gray-200 active:translate-y-1 transform transition"
        onClick={() => onDelete(todo.id)} // todo 객체 대신 todo.id를 전달
      >
        🗑️
      </button>
    </li>
  );
};

export default TodoItem;
