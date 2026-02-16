import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chatting } from './chatting';

describe('Chatting', () => {
  let component: Chatting;
  let fixture: ComponentFixture<Chatting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chatting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Chatting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
