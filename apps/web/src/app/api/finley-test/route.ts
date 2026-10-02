import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({message:'Use fixture tests; this endpoint cannot create live jobs.'},{status:410});}
