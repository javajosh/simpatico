import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodosComponent } from './todos.component';
import { TodoAddComponent } from './todo-add.component';
import { TodoEditComponent } from './todo-edit.component';



@NgModule({
  declarations: [
    TodosComponent,
    TodoAddComponent,
    TodoEditComponent
  ],
  imports: [
    CommonModule
  ]
})
export class TodosModule { }
