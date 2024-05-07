"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import TodoItem from '@/components/TodoItem';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// firebase 관련 모듈을 불러옵니다.
import { db } from '@/firebase';
import {
  collection,
  query,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from 'firebase/firestore';

// DB의 todos 컬렉션 참조를 만듭니다. 컬렉션 사용시 잘못된 컬렉션 이름 사용을 방지합니다.
const todoCollection = collection(db, 'todos');

const TodoList = () => {
  // 상태를 관리하는 useState 훅을 사용하여 할 일 목록과 입력값을 초기화합니다.
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  // 상태를 관리하는 useState 훅을 사용하여 날짜를 초기화합니다.
  const [date, setDate] = useState("");
  // 다른 사람들의 할 일을 보여줄지 여부를 결정하는 상태를 추가합니다.
  const [showOthers, setShowOthers] = useState(false);

  const router = useRouter();
  const { data } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    getTodos();
  } , [data]);

  const getTodos = async () => {
    // Firestore 쿼리를 만듭니다.
    // const q = query(todoCollection);

    let q;

    if (showOthers) {
      // 다른 사람들의 할 일을 보여줄 경우, userName 조건을 제거합니다.
      q = query(todoCollection);
    } else {
      // 자신의 할 일만 보여줄 경우, userName 조건을 추가합니다.
      if (!data?.user?.name) return;
      q = query(todoCollection, where("userName", "==", data?.user?.name));
    }

    // Firestore 에서 할 일 목록을 조회합니다.
    const results = await getDocs(q);
    const newTodos = [];

    // 가져온 할 일 목록을 newTodos 배열에 담습니다.
    results.docs.forEach((doc) => {
      // id 값을 Firebase 에 저장한 값으로 지정하고, 나머지 데이터를 newtodos 배열에 담습니다.
      newTodos.push({ id: doc.id, ...doc.data() });
    });

    setTodos(newTodos);
  };

  // addTodo 함수는 입력값을 이용하여 새로운 할 일을 목록에 추가하는 함수입니다.
  const addTodo = async() => {
    // 입력값이 비어있는 경우 함수를 종료합니다.
    if (input.trim() === "") return;

    // 날짜가 선택되지 않았을 경우 현재 날짜를 사용합니다.
    const currentDate = date || new Date().toISOString().split('T')[0];

    // Firesotre 에 추가한 일을 저장합니다.
    const docRef = await addDoc(todoCollection, {
      userName: data?.user?.name,
      text: input,
      date: currentDate,
      completed: false,
    });

    // id 값을 Firestore 에 저장한 값으로 지정합니다.
    setTodos([...todos, { id: docRef.id, text: input, date: currentDate, completed: false }]);
    setInput("");
    setDate("");

    // 할 일을 추가한 후에 getTodos 함수를 호출하여 할 일 목록을 업데이트합니다.
    getTodos();
  };

  // toggleTodo 함수는 체크박스를 눌러 할 일의 완료 상태를 변경하는 함수입니다.
  const toggleTodo = (id) => {
    // 할 일 목록에서 해당 id를 가진 할 일의 완료 상태를 반전시킵니다.
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          // Firestore 에서 해당 id를 가진 할 일의 완료 상태를 업데이트합니다.
          const todoDoc = doc(todoCollection, id)
          updateDoc(todoDoc, { completed: !todo.completed });
          return { ...todo, completed: !todo.completed };
        } else {
          return todo;
        }
      })
    )
  };

  // deleteTodo 함수는 할 일을 목록에서 삭제하는 함수입니다.
  const deleteTodo = (id) => {
    // Firestore 에서 해당 id를 가진 할 일을 삭제합니다.
    const todoDoc = doc(todoCollection, id);
    deleteDoc(todoDoc);

    // 해당 id를 가진 할 일을 제외한 나머지 목록을 새로운 상태로 저장합니다.
    setTodos(
      todos.filter((todo) => {
        return todo.id !== id;
      })
    )
  };

  // deleteAll 함수는 사용자의 모든 할 일을 삭제하는 함수입니다.
  const deleteAll = async (userName) => {
    // Firestore 에서 해당 사용자의 모든 할 일을 삭제합니다.
    const q = query(todoCollection, where("userName", "==", userName));
    const results = await getDocs(q);

    results.docs.forEach((document) => {
      const todoDoc = doc(todoCollection, document.id);
      deleteDoc(todoDoc);
    });

    // 상태를 업데이트하여 화면을 갱신합니다.
    getTodos();
  };

  // 컴포넌트를 렌더링합니다.
  return (
    <div className="mx-auto max-w-sm p-5 bg-white rounded-lg shadow">
      <h1 className="text-center text-2xl font-bold">Todo List</h1>
      <Input
        type="text"
        className="w-full p-1 mb-2 text-black border-gray-200 rounded shadow focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="할 일을 입력하세요"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Input
        type="date"
        className="w-full p-1 mb-2 text-black border-gray-200 rounded shadow focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Button
        className="w-full p-1 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:translate-y-1 transform transition mr-2"
        onClick={addTodo}
      >
        Add Todo
      </Button>
      <Button
        className="w-full p-1 mb-2 bg-green-500 text-white rounded hover:bg-green-600 active:translate-y-1 transform transition mr-2"
        onClick={() => {
          setShowOthers(!showOthers); // 버튼 클릭 시 showOthers 상태를 반전시킵니다.
          getTodos(); // 상태 변경 후 할 일 목록을 다시 가져옵니다.
        }}
      >
        {showOthers ? "내 할 일이나 하자.." : "다른 사람들은 뭘 하고 있을까?"}
      </Button>
      <Button
        className="w-full p-1 mb-2 bg-red-500 text-white rounded hover:bg-red-600 active:translate-y-1 transform transition mr-2"
        onClick={() => signOut()}
      >
        Sign Out
      </Button>
      <ul className="list-none p-0">
      {Object.entries(
        todos.reduce((groups, todo) => {
          const group = todo.userName;
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(todo);
          return groups;
        }, {})
      ).sort(([userNameA], [userNameB]) => userNameA.localeCompare(userNameB)).map(([userName, todosInGroup]) => (
      <React.Fragment key={userName}>
          <li className="text-lg font-bold flex justify-between items-center">
            {userName}
            <Button
              className="ml-2 p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 active:translate-y-1 transform transition"
              onClick={() => deleteAll(userName)}
            >
              {userName === data?.user?.name ? "Delete All" : "방해하기"}
            </Button>
          </li>
          {todosInGroup.sort((a, b) => new Date(a.date) - new Date(b.date)).map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
        </React.Fragment>
      ))}
      </ul>
        {todos.length === 0 && (
      <div className="text-center mt-5">
        <img src="empty-list-image.png" alt="Empty list" className="mx-auto w-1/2" />
        <p className="text-lg mt-2">할 일이 없습니다.</p>
      </div>
      )}
    </div>
  );
};

export default TodoList;
