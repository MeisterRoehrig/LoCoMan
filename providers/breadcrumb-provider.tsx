'use client';

import React, { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { useProjects } from '@/providers/projects-provider';

export const BreadcrumbProvider = () => {
  /* ---------- locate us ---------- */
  const pathname = usePathname();                  // e.g. /dashboard/abc123/data
  const segments = pathname.split('/').filter(Boolean);

  // outside /dashboard, render nothing
  if (segments[0] !== 'dashboard') return null;

  const projectId   = segments[1];                 // undefined on /dashboard
  const onDataPage  = segments[2] === 'data';

  /* ---------- project title ---------- */
  const { projects } = useProjects();
  const projectName = useMemo(
    () => projects.find(p => p.id === projectId)?.title ?? projectId,
    [projects, projectId],
  );

  /* ---------- build crumbs ---------- */
  type Crumb = { label: string; href?: string };

  const crumbs: Crumb[] = [
    { label: 'Dashboard' },                        // never clickable
  ];

  if (projectId) {
    crumbs.push({
      label: projectName,
      // only clickable when a deeper “data” page exists
      href: onDataPage ? `/dashboard/${projectId}` : undefined,
    });
  }

  if (onDataPage) {
    crumbs.push({ label: 'Data' });                // final crumb, no link
  }

  /* ---------- render ---------- */
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast  = i === crumbs.length - 1;
          const isLink  = !!crumb.href && !isLast; // never link the final crumb

          return (
            <Fragment key={i}>
              <BreadcrumbItem>
                {isLink ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href!}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbProvider;
