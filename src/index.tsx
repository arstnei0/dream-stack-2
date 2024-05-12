import { Elysia, t } from "elysia"
import { html } from "@elysiajs/html"

let idCounter = 0
function generateId() {
    idCounter++
    return idCounter
}

type Todo = { id: number; content: string; done: boolean }
type DB = { todos: Todo[] }

function seedDB(db: DB) {
    db.todos.push(
        { id: generateId(), content: "make this todolist", done: false },
        { id: generateId(), content: "have fun", done: true }
    )
}

const db: DB = { todos: [] }
seedDB(db)

function Todo({ todo }: { todo: Todo }) {
    return (
        <div>
            <input
                type="checkbox"
                checked={todo.done}
                hx-post={`/toggle/${todo.id}`}
                hx-target="closest div"
            />
            <button
                hx-delete={`/delete/${todo.id}`}
                hx-swap="delete"
                hx-target="closest div"
            >
                X
            </button>
            {todo.content}
        </div>
    )
}

function Todolist({ todos }: { todos: Todo[] }) {
    return (
        <div>
            <div id="todolist">
                {todos.map((todo) => (
                    <Todo todo={todo}></Todo>
                ))}
            </div>
            <form
                hx-post="/create"
                hx-target="#todolist"
                hx-swap="beforeend"
                _="on submit target.reset()"
            >
                <input type="text" name="content"></input>
                <button type="submit">Create</button>
            </form>
        </div>
    )
}

new Elysia()
    .use(html())
    .delete(
        "/delete/:id",
        ({ params }) => {
            db.todos.splice(
                db.todos.findIndex((todo) => todo.id === params.id),
                1
            )
        },
        {
            params: t.Object({ id: t.Numeric() }),
        }
    )
    .post(
        "/toggle/:id",
        ({ params, error }) => {
            const todo = db.todos.find((todo) => todo.id === params.id)
            if (!todo) return error("Bad Request")

            todo.done = !todo.done

            return <Todo todo={todo}></Todo>
        },
        { params: t.Object({ id: t.Numeric() }) }
    )
    .post(
        "/create",
        ({ body }) => {
            const newTodo: Todo = {
                id: generateId(),
                content: body.content,
                done: false,
            }

            db.todos.push(newTodo)

            return <Todo todo={newTodo}></Todo>
        },
        { body: t.Object({ content: t.String() }) }
    )
    .get("/", () => (
        <html lang="en">
            <head>
                <title>Hello World</title>
                <script
                    src="https://unpkg.com/htmx.org@1.9.12"
                    integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
                    crossorigin="anonymous"
                ></script>
                <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
            </head>
            <body>
                <Todolist todos={db.todos}></Todolist>
            </body>
        </html>
    ))
    .listen(3000)
