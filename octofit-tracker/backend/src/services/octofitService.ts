import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const userId = String(payload.userId ?? '');
  const teamId = String(payload.teamId ?? '');
  const type = String(payload.type ?? '').trim();
  const minutes = Number(payload.minutes ?? NaN);

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes.'), { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid Mongo ObjectIds.'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity userId and teamId must reference existing records.'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const name = String(payload.name ?? '').trim();
  const mascot = String(payload.mascot ?? '').trim();
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  if (!name || !mascot) {
    throw Object.assign(new Error('Team requires name and mascot.'), { status: 400 });
  }

  const uniqueMembers = [...new Set(rawMembers
    .filter((member): member is string => typeof member === 'string' || typeof member === 'object')
    .map((member) => typeof member === 'string' ? member : String(member))
    .filter((memberId) => mongoose.Types.ObjectId.isValid(memberId)))];

  const normalizedMembers = uniqueMembers.map((memberId) => new mongoose.Types.ObjectId(memberId));

  const team = await Team.create({ name, mascot, members: normalizedMembers });

  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('_id name').lean();
  const teamNames = new Map(teams.map(({ _id, name }) => [_id.toString(), name]));

  return totals.flatMap(({ _id, totalPoints }, index) => {
    const teamName = teamNames.get(_id.toString());
    return teamName ? [{ teamName, totalPoints, rank: index + 1 }] : [];
  });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recentActivity
    ? recentActivity.type === 'run' || recentActivity.type === 'cycle'
      ? 'endurance'
      : recentActivity.type
    : undefined;
  const focus = activityFocus || user.fitnessGoal;
  const workouts = await Workout.find().lean();
  const matchingWorkouts = workouts.filter((workout) => workout.focus.toLowerCase() === focus.toLowerCase());
  const otherWorkouts = workouts.filter((workout) => workout.focus.toLowerCase() !== focus.toLowerCase());

  return [...matchingWorkouts, ...otherWorkouts].map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === focus.toLowerCase()
      ? `Recommended based on your ${activityFocus ? `${recentActivity?.type} activity` : 'fitness goal'} (${focus}).`
      : `Suggested as an alternative to your current ${focus} focus.`,
  }));
}

export { User };
