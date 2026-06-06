import { ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function BackToExperienceLink() {
  return (
    <NavLink className="experience-back-link" to="/">
      <ArrowLeft size={16} />
      <span>Back to Experience</span>
    </NavLink>
  );
}
