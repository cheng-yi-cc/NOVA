"use client"

import { useEffect, useRef } from "react"

export function NovaLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Animation variables
    let frame = 0
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) * 0.8

    function drawParticleRing(particleCount: number, ringRadius: number, rotation: number, alpha: number) {
      for (let i = 0; i < particleCount; i++) {
        const angle = (i * Math.PI * 2) / particleCount + rotation
        const x = centerX + Math.cos(angle) * ringRadius
        const y = centerY + Math.sin(angle) * ringRadius

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3)
        gradient.addColorStop(0, `rgba(138, 254, 254, ${alpha})`)
        gradient.addColorStop(1, "rgba(138, 254, 254, 0)")

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5)
      bgGradient.addColorStop(0, "#2A5C8F")
      bgGradient.addColorStop(1, "#63B4E3")

      // Draw base circle
      ctx.beginPath()
      ctx.fillStyle = bgGradient
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw particle rings
      const baseRotation = frame * 0.01
      drawParticleRing(7, radius * 0.5, baseRotation, 0.8)
      drawParticleRing(12, radius * 0.7, -baseRotation * 0.5, 0.6)
      drawParticleRing(24, radius * 0.9, baseRotation * 0.3, 0.4)

      // Draw center star
      const starPoints = 12
      ctx.beginPath()
      ctx.fillStyle = "#8AFEFE"
      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i * Math.PI) / starPoints
        const r = i % 2 === 0 ? radius * 0.2 : radius * 0.1
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()

      frame++
      requestAnimationFrame(draw)
    }

    draw()
  }, [])

  return (
    <div className="relative w-full flex justify-center py-6">
      <canvas ref={canvasRef} width="200" height="200" className="w-[200px] h-[200px]" />
      <h1 className="absolute bottom-8 text-6xl font-bold tracking-[0.25em] text-[#8AFEFE]">NOVA</h1>
    </div>
  )
}

