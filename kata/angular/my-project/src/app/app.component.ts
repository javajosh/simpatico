import { Component } from '@angular/core';
import { StoreModule, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface AppState {
  message: string;
}

const initialState: AppState = {
  message: 'Hello World'
};

// const reducer = (state = initialState) => {
//   switch (action.type) {
//     case 'SPANISH':
//       return { message: 'Hola Mundo' };
//     case 'FRENCH':
//       return { message: 'Bonjour le monde' };
//     default:
//       return state;
//   }
// };

// const store = new Store(reducer, initialState, () => {});

// const message$: Observable<string> = store.pipe(map(state => state.message));


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-project';
}
