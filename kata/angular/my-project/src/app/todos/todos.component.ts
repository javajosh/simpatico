import { Component } from '@angular/core';

@Component({
  selector: 'app-todos',
  template: `
    <h1>Todos</h1>
    <button (click)="remove()">Remove</button>
    <form (ngSubmit)="add(newTodo)">
      <input
        name="newTodo"
        placeholder="Enter a new todo"
        type="text"
        [(ngModel)]="newTodo" >
      <button type="submit">Add</button>
    </form>
    <ng-container *ngIf="todos.length > 0; else noItems">
      <ol>
        <li *ngFor="let item of todos">
          {{item}}
        </li>
      </ol>
    </ng-container>
    <ng-template #noItems>
      <p>No items</p>
    </ng-template>

    <app-todo-add></app-todo-add>
    <app-todo-edit></app-todo-edit>
  `,
  styles: [
  ]
})
export class TodosComponent {
  n = 2;
  todos : string[] = ['Todo 1', 'Todo 2'];
  newTodo = '';

  add(todo: string | undefined) {
    this.todos.push(todo || ('Todo ' + this.n++));
    this.newTodo = '';
  }
  remove() {
    this.todos.pop();
  }
}
