import { Button } from './Button'
import { useEffect, useState } from 'react'
import type { InterviewRound } from './fluency'
export function InterviewStatus({ round, onControls }: { round: InterviewRound; onControls: () => void }) {
  const [now,setNow]=useState(Date.now)
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  const seconds=Math.max(0,Math.ceil((Date.parse(round.startedAt)+round.minutes*60_000-now)/1000))
  return <section className="interview-banner" aria-label="Interview round"><strong>{seconds?`Time remaining ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'Time budget reached'}</strong><p>Clarify, plan, implement, explain, then review. Your work stays saved when time ends.</p><Button variant="text" type="button" onClick={onControls}>Round controls and debrief</Button></section>
}
