/**
 * Single hero image for the welcome (intro) step only — church community gathering.
 */
export type StepImage = {
  src: string;
  alt: string;
};

const q = (id: number, w = 960) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const SURVEY_INTRO_HERO_IMAGE: StepImage = {
  src: q(3014876),
  alt: "Congregation gathered for worship — church community",
};
