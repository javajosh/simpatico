import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodosComponent } from './todos.component';
import { TodoAddComponent } from './todo-add.component';
import { TodoEditComponent } from './todo-edit.component';
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    TodosComponent,
    TodoAddComponent,
    TodoEditComponent
  ],
  exports: [
    TodosComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class TodosModule { }
