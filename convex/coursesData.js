import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCourse = mutation({
  args: {
    topic: v.string(),
    format: v.string(),
    createdBy: v.string(),
    showQuestions: v.boolean(),
    courseTitle: v.string(),
    
    modules: v.array(v.object({
      id: v.string(),
      title: v.string(),
      lessons: v.array(v.object({
        id: v.string(),
        title: v.string()
      }))
    })),
  },
  handler: async (ctx, args) => {
    const courseId = await ctx.db.insert("courses", {
      topic: args.topic,
      format: args.format,
      createdBy: args.createdBy,
      showQuestions: args.showQuestions,
      courseTitle: args.courseTitle,
    });

    for (const [moduleIndex, module] of args.modules.entries()) {
      const moduleId = await ctx.db.insert("modules", {
        courseId: courseId,
        moduleId: module.id,
        title: module.title,
        order: moduleIndex + 1,
      });

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await ctx.db.insert("lessons", {
          moduleId: moduleId,
          lessonId: lesson.id,
          title: lesson.title,
          order: lessonIndex + 1,
        });
      }
    }
    
    return courseId;
  },
});

// Query to fetch a course by ID with all its modules and lessons
export const getCourseById = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // Fetch the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Fetch all modules for this course
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Sort modules by order
    modules.sort((a, b) => a.order - b.order);

    // For each module, fetch its lessons
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
          .collect();

        // Sort lessons by order
        lessons.sort((a, b) => a.order - b.order);

        return {
          id: module.moduleId,
          _id: module._id,
          title: module.title,
          order: module.order,
          lessons: lessons.map(lesson => ({
            id: lesson.lessonId,
            title: lesson.title,
            order: lesson.order
          }))
        };
      })
    );

    // Return the full course data
    return {
      _id: course._id,
      courseTitle: course.courseTitle,
      topic: course.topic,
      format: course.format,
      createdBy: course.createdBy,
      showQuestions: course.showQuestions,
      createdAt: course._creationTime,
      modules: modulesWithLessons
    };
  }
});




// Query to get the latest course for a user
export const getLatestCourseByUser = query({
  args: { createdBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // If no createdBy is provided, return null
    if (!args.createdBy) {
      return null;
    }
    
    // Find all courses for this user
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.createdBy))
      .collect();

    if (courses.length === 0) {
      return null;
    }

    // Sort by creation time, newest first
    courses.sort((a, b) => b._creationTime - a._creationTime);
    
    // Get the latest course
    const latestCourse = courses[0];
    
    // Use the getCourseById handler to get the full data
    return await getCourseById.handler(ctx, { courseId: latestCourse._id });
  }
});

// Query to get all courses for a user by email (createdBy), including modules and lessons
export const getAllCoursesByUser = query({
  args: { createdBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // If no createdBy is provided, return empty array
    if (!args.createdBy) {
      return [];
    }
    
    // Find all courses for this user by email
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", args.createdBy))
      .collect();

    if (courses.length === 0) {
      return [];
    }

    // For each course, fetch all its modules and lessons
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        // Fetch all modules for this course
        const modules = await ctx.db
          .query("modules")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();

        // Sort modules by order
        modules.sort((a, b) => a.order - b.order);

        // For each module, fetch its lessons
        const modulesWithLessons = await Promise.all(
          modules.map(async (module) => {
            const lessons = await ctx.db
              .query("lessons")
              .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
              .collect();

            // Sort lessons by order
            lessons.sort((a, b) => a.order - b.order);

            return {
              id: module.moduleId,
              _id: module._id,
              title: module.title,
              order: module.order,
              lessons: lessons.map(lesson => ({
                id: lesson.lessonId,
                title: lesson.title,
                order: lesson.order
              }))
            };
          })
        );

        // Return the complete course data with modules and lessons
        return {
          _id: course._id,
          courseTitle: course.courseTitle,
          topic: course.topic,
          format: course.format,
          createdBy: course.createdBy,
          showQuestions: course.showQuestions,
          createdAt: course._creationTime,
          modules: modulesWithLessons
        };
      })
    );

    // Sort the courses by creation time (newest first)
    coursesWithDetails.sort((a, b) => b.createdAt - a.createdAt);

    return coursesWithDetails;
  }
});

