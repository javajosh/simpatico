import { Component } from '@angular/core';


interface AppState {
  message: string;
}

const initialState: AppState = {
  message: 'Hello World'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'my-project';
}
