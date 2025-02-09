"use client"

import { useEffect, useRef, useMemo } from "react"
import { useTheme } from "@/lib/store"

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinkleSpeed: number
  color: string
  targetX?: number
  targetY?: number
  velocity?: { x: number; y: number }
}

interface ShootingStar {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  angle: number
  fadeSpeed: number
  width: number
  color: string
  sparkles: Array<{
    x: number
    y: number
    size: number
    opacity: number
  }>
}

interface Nebula {
  x: number
  y: number
  radius: number
  color: string
  opacity: number
  pulseSpeed: number
  pulsePhase: number
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const frameRef = useRef<number>()
  const { theme } = useTheme()

  // Memoize colors based on theme
  const colors = useMemo(() => ({
    background: {
      dark: {
        top: '#000000',
        middle: '#050714',
        bottom: '#000000'
      },
      light: {
        top: '#E6E8F0',
        middle: '#B8C6E3',
        bottom: '#E8EAF2'
      }
    },
    stars: {
      dark: [
        '#ffffff', // 白色
        '#fffaf0', // 暖白
        '#f0f8ff', // 冷白
        '#87ceeb', // 天蓝
        '#ffd700', // 金色
        '#ff8c00', // 橙色
        '#ff69b4', // 粉色
      ],
      light: [
        '#1a1a1a', // 深灰
        '#2a2a2a', // 中灰
        '#3a3a3a', // 浅灰
        '#0066cc', // 深蓝
        '#cc9900', // 深金
        '#cc5500', // 深橙
        '#cc3366', // 深粉
      ]
    }
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // 优化性能：使用 alpha: false 和离屏渲染
    const offscreen = new OffscreenCanvas(canvas.width, canvas.height)
    const offscreenCtx = offscreen.getContext("2d", { alpha: false })
    if (!offscreenCtx) return

    // 设置高DPI画布
    const dpr = window.devicePixelRatio || 1
    const updateCanvasSize = () => {
      if (!canvas) return
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      offscreen.width = width * dpr
      offscreen.height = height * dpr
      ctx.scale(dpr, dpr)
      offscreenCtx.scale(dpr, dpr)
    }
    updateCanvasSize()

    // 生成星星
    if (!canvas) return
    const starCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 20000))
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 0.5 + Math.random() * 1.2,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.001 + Math.random() * 0.002,
      color: colors.stars[theme][Math.floor(Math.random() * 3)],
      velocity: { x: 0, y: 0 }
    }))

    // 生成星云
    const nebulas: Nebula[] = Array.from({ length: 2 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.5),
      radius: 80 + Math.random() * 150,
      color: colors.stars[theme][Math.floor(Math.random() * colors.stars[theme].length)],
      opacity: 0.03 + Math.random() * 0.08,
      pulseSpeed: 0.0005 + Math.random() * 0.001,
      pulsePhase: Math.random() * Math.PI * 2
    }))

    const shootingStars: ShootingStar[] = []

    // 绘制星云
    function drawNebula(nebula: Nebula, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
      const pulseOpacity = nebula.opacity * (0.8 + Math.sin(Date.now() * nebula.pulseSpeed + nebula.pulsePhase) * 0.2)
      const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
      )
      gradient.addColorStop(0, `${nebula.color}${Math.round(pulseOpacity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制星星
    function drawStar(star: Star, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
      const gradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * 4
      )
      
      const alpha = (0.5 + Math.sin(Date.now() * star.twinkleSpeed) * 0.5) * star.opacity
      gradient.addColorStop(0, `${star.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.1, `${star.color}${Math.round(alpha * 0.8 * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.5, `${star.color}${Math.round(alpha * 0.3 * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = star.color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // 绘制流星
    function drawShootingStar(star: ShootingStar, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
      ctx.save()
      ctx.translate(star.x, star.y)
      ctx.rotate(star.angle)

      const trailGradient = ctx.createLinearGradient(0, 0, star.length, 0)
      trailGradient.addColorStop(0, `${star.color}${Math.round(star.opacity * 255).toString(16).padStart(2, '0')}`)
      trailGradient.addColorStop(0.3, `${star.color}${Math.round(star.opacity * 0.8 * 255).toString(16).padStart(2, '0')}`)
      trailGradient.addColorStop(0.7, `${star.color}${Math.round(star.opacity * 0.3 * 255).toString(16).padStart(2, '0')}`)
      trailGradient.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.strokeStyle = trailGradient
      ctx.lineWidth = star.width
      ctx.lineCap = 'round'
      ctx.moveTo(0, 0)
      ctx.lineTo(star.length, 0)
      ctx.stroke()

      const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, star.width * 4)
      headGradient.addColorStop(0, `${star.color}${Math.round(star.opacity * 255).toString(16).padStart(2, '0')}`)
      headGradient.addColorStop(0.5, `${star.color}${Math.round(star.opacity * 0.5 * 255).toString(16).padStart(2, '0')}`)
      headGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = headGradient
      ctx.beginPath()
      ctx.arc(0, 0, star.width * 4, 0, Math.PI * 2)
      ctx.fill()

      star.sparkles.forEach((sparkle, index) => {
        const sparkleGradient = ctx.createRadialGradient(
          sparkle.x, sparkle.y, 0,
          sparkle.x, sparkle.y, sparkle.size
        )
        sparkleGradient.addColorStop(0, `${star.color}${Math.round(sparkle.opacity * 255).toString(16).padStart(2, '0')}`)
        sparkleGradient.addColorStop(1, 'transparent')

        ctx.fillStyle = sparkleGradient
        ctx.beginPath()
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2)
        ctx.fill()

        star.sparkles[index].opacity *= 0.95
        star.sparkles[index].size *= 0.98
      })

      star.sparkles = star.sparkles.filter(sparkle => sparkle.opacity > 0.1)

      if (Math.random() < 0.3) {
        star.sparkles.push({
          x: Math.random() * star.length * 0.8,
          y: (Math.random() - 0.5) * star.width * 4,
          size: Math.random() * star.width * 2,
          opacity: Math.random() * 0.5 + 0.5
        })
      }

      ctx.restore()
    }

    // 更新星星位置
    function updateStarPositions() {
      if (!mouseRef.current) return

      stars.forEach(star => {
        if (!star.targetX || !star.targetY) {
          star.targetX = star.x
          star.targetY = star.y
        }

        // 计算与鼠标的距离
        const dx = mouseRef.current!.x - star.x
        const dy = mouseRef.current!.y - star.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 80

        if (distance < maxDistance) {
          // 在鼠标范围内的星星会被排斥
          const force = (1 - distance / maxDistance) * 0.015
          star.velocity!.x -= dx * force
          star.velocity!.y -= dy * force
        }

        // 应用速度
        star.x += star.velocity!.x
        star.y += star.velocity!.y

        // 减速
        star.velocity!.x *= 0.95
        star.velocity!.y *= 0.95

        // 边界检查
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0
      })
    }

    // 动画循环
    function animate() {
      if (!offscreenCtx || !ctx || !canvas) return

      offscreenCtx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制渐变背景
      const gradient = offscreenCtx.createLinearGradient(0, 0, 0, canvas.height)
      const { top, middle, bottom } = colors.background[theme]
      gradient.addColorStop(0, top)
      gradient.addColorStop(0.5, middle)
      gradient.addColorStop(1, bottom)
      offscreenCtx.fillStyle = gradient
      offscreenCtx.fillRect(0, 0, canvas.width, canvas.height)

      // 更新和绘制所有元素
      nebulas.forEach(nebula => drawNebula(nebula, offscreenCtx))
      updateStarPositions()
      stars.forEach(star => drawStar(star, offscreenCtx))

      // 生成新的流星
      if (Math.random() < 0.005 && shootingStars.length < 2) {
        const startX = -50 + Math.random() * (canvas.width * 0.3)
        const startY = Math.random() * (canvas.height * 0.3)
        const angle = Math.PI / 6 + (Math.random() * Math.PI / 8)

        shootingStars.push({
          x: startX,
          y: startY,
          length: 100 + Math.random() * 80,
          speed: 4 + Math.random() * 2,
          opacity: 0.7 + Math.random() * 0.3,
          angle: angle,
          fadeSpeed: 0.002 + Math.random() * 0.002,
          width: 1.5 + Math.random() * 0.5,
          color: colors.stars[theme][Math.floor(Math.random() * 3)],
          sparkles: []
        })
      }

      // 更新和绘制流星
      shootingStars.forEach((star, index) => {
        drawShootingStar(star, offscreenCtx)
        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed
        star.opacity -= star.fadeSpeed
        star.width *= 0.995

        if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
          shootingStars.splice(index, 1)
        }
      })

      // 将离屏画布内容复制到主画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(offscreen, 0, 0)

      frameRef.current = requestAnimationFrame(animate)
    }

    // 事件监听器
    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!canvas) return
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      mouseRef.current = {
        x: (touch.clientX - rect.left) * dpr,
        y: (touch.clientY - rect.top) * dpr
      }
    }

    function handleResize() {
      updateCanvasSize()
    }

    // 添加事件监听
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("mouseleave", () => { mouseRef.current = null })
    canvas.addEventListener("touchend", () => { mouseRef.current = null })
    window.addEventListener("resize", handleResize)

    // 启动动画
    animate()

    // 清理函数
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("mouseleave", () => { mouseRef.current = null })
      canvas.removeEventListener("touchend", () => { mouseRef.current = null })
      window.removeEventListener("resize", handleResize)
    }
  }, [theme, colors])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10"
      style={{ width: "100%", height: "100%" }}
    />
  )
}

