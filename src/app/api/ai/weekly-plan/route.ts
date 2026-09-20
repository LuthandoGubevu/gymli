import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromHeader } from '@/lib/firebase-admin-auth';
import { weeklyPlanFlow, WeeklyPlanInputSchema } from '@/ai/flows/weekly-plan';

export async function POST(req: NextRequest) {
  try {
    await verifyIdTokenFromHeader(req.headers.get('authorization'));
  } catch (error) {
    console.error('Weekly plan auth failed:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let input;
  try {
    const body = await req.json();
    input = WeeklyPlanInputSchema.parse(body);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const { result } = await weeklyPlanFlow.run(input);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error generating weekly plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan.' }, { status: 500 });
  }
}
