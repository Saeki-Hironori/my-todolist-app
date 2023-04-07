import React, { useEffect, useState } from "react";
import "./AddTodo.css";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

interface TODO {
  id: number;
  status: string;
  title: string;
  display: boolean;
  text: string;
}

const AddTodo = () => {
  const [todos, setTodos] = useState<TODO[]>([]);
  const [todoTitle, setTodoTitle] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [editId, setEditId] = useState<number | null>();
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [filteredTodos, setFilteredTodos] = useState<TODO[]>([]);

  // firestoreから全データを読み込み、todosにセットする関数。
  const fetchData = async () => {
    await getDocs(collection(db, "todoList")).then((querySnapshot: any) => {
      const todosData = querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodos(todosData);
      console.log(todosData);
    });
  };

  // ページを開いた際にデータベースを読み込む
  useEffect(() => {
    fetchData();
  }, []);

  // 追加ボタンを押すと、firestoreにデータを保存し、全データを再読み込みする。
  const addTodo = async () => {
    if (todoTitle !== "") {
      try {
        const docRef = await addDoc(collection(db, "todoList"), {
          status: "notStarted",
          title: todoTitle,
          display: false,
          text: "",
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }

      fetchData();
      setTodoTitle("");
    } else {
      alert("何か入力してね");
    }
  };

  // 削除ボタンを押すとfirestoreからそのidのデータを削除、データの再読み込み
  const deleteTodo = async (targetTodo: TODO) => {
    await deleteDoc(doc(db, "todoList", `${targetTodo.id}`));
    fetchData();
  };

  //編集ボタンを押すと編集モードに移行しそのidとタイトルを取得
  const editTodo = (targetTodo: TODO) => {
    setIsEditable(true);
    setEditId(targetTodo.id);
    setNewTitle(targetTodo.title);
    console.log(editId);
  };

  // 編集を保存ボタンを押すとfirestoreからそのidのデータのタイトルを編集
  const handleEditTodo = async () => {
    await updateDoc(doc(db, "todoList", `${editId}`), {
      title: newTitle,
    });
    setNewTitle("");
    setIsEditable(false);
    fetchData();
  };

  // ステータスを変更するとそのidのみデータを更新し、表示を切り替える（データ読み込みは行わない）
  const statusChange = async (
    targetTodo: TODO,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    await updateDoc(doc(db, "todoList", `${targetTodo.id}`), {
      status: e.target.value,
    });
    fetchData();
  };

  //詳細ボタンを押すとそのidのみdisplayを反転させる
  const displayDetail = (targetTodo: TODO) => {
    const newTodos = todos.map((todo) => ({ ...todo }));

    setTodos(
      newTodos.map((todo) =>
        todo.id === targetTodo.id
          ? { ...todo, display: !targetTodo.display }
          : todo
      )
    );
  };

  // 詳細テキストを変更するとそのidのみtextを変更する
  const textChange = (
    targetTodo: TODO,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTodos = todos.map((todo) => ({ ...todo }));

    setTodos(
      newTodos.map((todo) => {
        console.log(todo);
        return todo.id === targetTodo.id
          ? { ...todo, text: e.target.value }
          : todo;
      })
    );
    console.log(e.target.value);
  };

  // フィルター
  const filteringTodos = () => {
    switch (filter) {
      case "notStarted":
        setFilteredTodos(todos.filter((todo) => todo.status === "notStarted"));
        break;
      case "doing":
        setFilteredTodos(todos.filter((todo) => todo.status === "doing"));
        break;
      case "done":
        setFilteredTodos(todos.filter((todo) => todo.status === "done"));
        break;
      default:
        setFilteredTodos(todos);
    }
  };

  // フィルター（絞り込み）が変化したときに動作させる
  useEffect(() => {
    filteringTodos();
  }, [filter, todos]);

  // 確認用
  const check = () => {
    console.log(todos);
  };

  return (
    <>
      <div className="filter">
        <label>絞り込み</label>
        <select
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilter(e.target.value)
          }
        >
          <option value="all">すべて</option>
          <option value="notStarted">未着手</option>
          <option value="doing">進行中</option>
          <option value="done">完了</option>
        </select>
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id} className="list">
            <select
              value={todo.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                statusChange(todo, e);
              }}
            >
              <option value="notStarted">未着手</option>
              <option value="doing">進行中</option>
              <option value="done">完了</option>
            </select>
            <span className="todo_title">{todo.title}</span>
            <button onClick={() => editTodo(todo)}>編集</button>
            <button onClick={() => deleteTodo(todo)}>削除</button>
            {/* <button onClick={() => displayDetail(todo)}>詳細</button> */}
            {todo.display && (
              <p>
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => textChange(todo, e)}
                />
              </p>
            )}
          </li>
        ))}
      </ul>

      {isEditable ? (
        <>
          <input
            type="text"
            value={newTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewTitle(e.target.value)
            }
            placeholder="タスクを追加"
          />
          <button onClick={handleEditTodo}>編集を保存</button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={todoTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTodoTitle(e.target.value)
            }
            placeholder="タスクを追加"
          />
          <button onClick={addTodo}>追加</button>
          <div>
            <button id="check" onClick={check}>
              console.log
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default AddTodo;
