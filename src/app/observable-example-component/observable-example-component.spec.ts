import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservableExampleComponent } from './observable-example-component';

describe('ObservableExampleComponent', () => {
  let component: ObservableExampleComponent;
  let fixture: ComponentFixture<ObservableExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservableExampleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservableExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
