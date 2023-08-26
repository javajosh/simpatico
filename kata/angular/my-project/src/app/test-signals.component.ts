import { Component } from '@angular/core';
import { computed, effect, signal} from "@angular/core";

// ng generate component test-signals
@Component({
  selector: 'app-test-signals',
  template: `
    {{ fullName() }} <button (click)="setName('John')">Click</button>
  `,
  styles: []
})
export class TestSignalsComponent {
  firstName = signal('Jane');
  lastName = signal('Doe');
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

  constructor() {
    effect(() => console.log('Name changed:', this.fullName()));
  }

  setName(newName: string) {
    this.firstName.set(newName);
  }
}
