SET search_path TO pay_transparency;

-- fix the 'published_on' date of the "build in" announcement that was incorrectly
-- set in V1.0.38 to a time in the PDT timezone.  Add 7 hours to convert that
-- time into the UTC timezone.
update announcement set published_on = published_on + interval '7 hours' 
where title = 'Guidance for preparing reports';