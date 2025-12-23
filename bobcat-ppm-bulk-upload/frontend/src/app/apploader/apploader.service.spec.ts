import { TestBed } from '@angular/core/testing';

import { ApploaderService } from './apploader.service';

describe('ApploaderService', () => {
  let service: ApploaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApploaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
