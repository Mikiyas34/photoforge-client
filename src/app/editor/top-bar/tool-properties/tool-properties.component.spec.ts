import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolPropertiesComponent } from './tool-properties.component';

describe('ToolPropertiesComponent', () => {
  let component: ToolPropertiesComponent;
  let fixture: ComponentFixture<ToolPropertiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ToolPropertiesComponent]
    });
    fixture = TestBed.createComponent(ToolPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
