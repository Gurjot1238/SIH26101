/**
 * "Recommended for your gaps" — real dataset courses to open next, chosen from the
 * learner's own measured competency gaps.
 *
 * This sits directly under CompetencyGapSection on the Dashboard and answers the
 * question that section raises but does not: "you are weak here — so what do I open?".
 * The gap section ranks the gaps; this turns the top ones into links to real courses in
 * /catalog.
 *
 * Every number and every course comes from the server (GET /api/analytics/
 * recommended-courses): the gap ranking is the analytics engine's, and the courses are
 * whatever the dataset actually contains, matched through the competency→subject-tag
 * bridge in server/course-recommendations.mjs. The browser does no matching and invents
 * nothing — it draws what it was sent, and renders a quiet empty state (or nothing) when
 * there is no honest recommendation to make.
 *
 * It is a *new, additive* section: CompetencyGapSection is left untouched.
 */

import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, Clock3, GraduationCap, ListChecks } from 'lucide-react';
import { Badge, Card, SectionHeading } from '@/components/ui';
import {
  AnalyticsError,
  type CourseRecommendations,
  fetchRecommendedCourses,
} from '@/lib/analytics';

/** Same category→tone mapping the catalogue cards use, kept local to avoid coupling. */
function categoryTone(category: string): 'navy' | 'coral' | 'neutral' {
  const value = (category ?? '').toLowerCase();
  if (value.startsWith('tech')) return 'navy';
  if (value.startsWith('med')) return 'coral';
  return 'neutral';
}

/**
 * `refreshKey` lets a parent force a re-fetch after the data changed — the quiz result
 * screen bumps it once the just-finished attempt has been saved, so the recommendations
 * reflect that sitting. Omitted on the Dashboard, where a mount is always fresh.
 */
export function GapCourseRecommendations({ refreshKey = 0 }: { refreshKey?: number } = {}) {
  const [data, setData] = useState<CourseRecommendations | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let live = true;
    fetchRecommendedCourses()
      .then((payload) => {
        if (!live) return;
        setData(payload);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        // The gap section above already reports a server or auth problem; this section
        // stays quiet rather than showing the same error twice.
        if (!live) return;
        void (error instanceof AnalyticsError);
        setStatus('unavailable');
      });
    return () => { live = false; };
  }, [refreshKey]);

  if (status === 'loading') {
    return <div className="mt-7">
      <Card className="p-5">
        <SectionHeading eyebrow="Recommended for your gaps" title="Finding courses that close your gaps…" />
      </Card>
    </div>;
  }

  // No dataset loaded, a transport error, or no data at all: draw nothing. The catalogue
  // and the gap chart cover those states in their own places.
  if (status === 'unavailable' || !data || !data.available) return null;

  // Before the first assessment there are no measured gaps; the gap section already
  // prompts the learner to sit one, so this section adds nothing and stays hidden.
  if (!data.measured) return null;

  return <div className="mt-7">
    <Card className="p-5" >
      <SectionHeading
        eyebrow="Recommended for your gaps"
        title="Courses that close your weakest competencies"
        description="Chosen from your measured gaps, worst first, and matched to real courses in the catalogue. Open one to start marking lessons done."
      />

      {!data.hasGaps || data.courses.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {data.note ?? 'No open competency gap can be matched to a course in the current dataset.'}
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((course) => (
              <Link
                key={course.courseId}
                href={`/catalog/${course.courseId}`}
                data-testid={`link-recommended-course-${course.courseId}`}
                className="group flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5 shadow-[0_3px_15px_hsl(214_30%_20%/.035)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_hsl(214_30%_20%/.08)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={categoryTone(course.category)}>{course.category || 'Course'}</Badge>
                  <Badge tone="teal"><GraduationCap className="size-3" /> {course.forCompetencyName}</Badge>
                </div>
                <h3 className="font-semibold leading-snug">{course.title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{course.reason}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1"><ListChecks className="size-3.5" />{course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'}</span>
                  {course.estimatedHours ? <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.estimatedHours} hrs</span> : null}
                  <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">Open <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
            Matches are by subject, not by an official mandate: the catalogue is open CS, engineering and medical courseware, so a gap with no closely-matching course is left out rather than filled with an unrelated one.
          </p>
        </>
      )}
    </Card>
  </div>;
}
