import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Component({
  selector: 'app-observable-example-component',
  imports: [],
  templateUrl: './observable-example-component.html',
  styleUrl: './observable-example-component.css'
})
export class ObservableExampleComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.subscriptionInit()
  }
  ngOnDestroy(): void {
    this.unsub()
  }
  mioObservable = new Observable(subscriber => {
    subscriber.next('primo valore');
    subscriber.next('secondo valore');
    subscriber.next('terzo valore');
    subscriber.complete();
  } )

  mioObservableSub: Subscription = new Subscription;

  subscriptionInit(){
    this.mioObservableSub =
      this.mioObservable.subscribe({
        next: (valore) => {
          console.log('ricevuto', valore)
        },
        error: (err) =>{
          console.error('error: ', err)
        },
        complete: () =>{
          console.log('observable Completato')
        }
      })
  }

  unsub(){
    this.mioObservableSub.unsubscribe()
  }
}
