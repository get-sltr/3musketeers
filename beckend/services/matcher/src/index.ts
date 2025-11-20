import { MatcherService } from './matcher.service';

const matcher = new MatcherService();

export { matcher, MatcherService };
export * from './scoring-engine';
export * from './compatibility-calculator';
export * from './recommendation-generator';
