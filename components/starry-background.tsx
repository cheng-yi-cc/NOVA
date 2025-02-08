"use client"

import { useEffect, useRef } from "react"

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinkleSpeed: number
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
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Generate random stars
    const stars: Star[] = Array.from({ length: 300 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.7),
      size: Math.random() * 2,
      opacity: Math.random(),
      twinkleSpeed: 0.01 + Math.random() * 0.02
    }))

    // Shooting stars array
    const shootingStars: ShootingStar[] = []

    // Draw silhouette function
    function drawSilhouette() {
      if (!ctx || !canvas) return
      
      const groundY = height * 0.95
      const silhouetteX = width * 0.95
      
      // 绘制地面渐变
      const groundGradient = ctx.createLinearGradient(silhouetteX - 300, groundY, silhouetteX + 100, groundY)
      groundGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      groundGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)")
      groundGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      
      ctx.beginPath()
      ctx.moveTo(silhouetteX - 300, groundY)
      ctx.lineTo(silhouetteX + 100, groundY)
      ctx.strokeStyle = groundGradient
      ctx.lineWidth = 1
      ctx.stroke()

      // 绘制少年剪影
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)"
      
      const boyHeight = height * 0.12
      const boyWidth = boyHeight * 0.35
      const boyX = silhouetteX - boyWidth * 2
      const boyY = groundY
      
      ctx.beginPath()
      
      // 头部（略微前倾）
      const headRadius = boyWidth * 0.25
      ctx.arc(boyX + headRadius * 0.3, boyY - boyHeight * 0.8, headRadius, 0, Math.PI * 2)
      
      // 身体轮廓（更自然的坐姿）
      ctx.moveTo(boyX - boyWidth * 0.3, boyY - boyHeight * 0.65)
      
      // 左肩到右肩
      ctx.quadraticCurveTo(
        boyX + boyWidth * 0.1, boyY - boyHeight * 0.7,
        boyX + boyWidth * 0.5, boyY - boyHeight * 0.6
      )
      
      // 后背曲线（更自然的弧度）
      ctx.quadraticCurveTo(
        boyX + boyWidth * 0.4, boyY - boyHeight * 0.45,
        boyX + boyWidth * 0.3, boyY - boyHeight * 0.25
      )
      
      // 右腿（盘坐）
      ctx.quadraticCurveTo(
        boyX + boyWidth * 0.2, boyY - boyHeight * 0.15,
        boyX + boyWidth * 0.1, boyY
      )
      
      // 左腿（盘坐）
      ctx.quadraticCurveTo(
        boyX - boyWidth * 0.2, boyY - boyHeight * 0.15,
        boyX - boyWidth * 0.3, boyY - boyHeight * 0.25
      )
      
      // 连接回躯干
      ctx.quadraticCurveTo(
        boyX - boyWidth * 0.4, boyY - boyHeight * 0.45,
        boyX - boyWidth * 0.3, boyY - boyHeight * 0.65
      )
      
      ctx.fill()

      // 绘制狗的剪影
      const dogWidth = boyWidth * 0.9
      const dogHeight = boyHeight * 0.6
      const dogX = boyX + boyWidth * 2
      const dogY = groundY

      ctx.beginPath()
      
      // 身体主体
      ctx.moveTo(dogX, dogY)
      
      // 后背轮廓（更圆润的曲线）
      ctx.quadraticCurveTo(
        dogX - dogWidth * 0.2, dogY - dogHeight * 0.7,
        dogX + dogWidth * 0.1, dogY - dogHeight * 0.8
      )
      
      // 头部轮廓（更精细的曲线）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.3, dogY - dogHeight * 0.9,
        dogX + dogWidth * 0.4, dogY - dogHeight * 0.85
      )
      
      // 吻部（更细致的形状）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.5, dogY - dogHeight * 0.8,
        dogX + dogWidth * 0.45, dogY - dogHeight * 0.75
      )
      
      // 耳朵（更立体）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.3, dogY - dogHeight * 1.1,
        dogX + dogWidth * 0.2, dogY - dogHeight * 0.85
      )
      
      // 颈部到胸部（更自然的过渡）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.3, dogY - dogHeight * 0.6,
        dogX + dogWidth * 0.35, dogY - dogHeight * 0.4
      )
      
      // 前腿（更自然的蜷缩姿势）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.3, dogY - dogHeight * 0.2,
        dogX + dogWidth * 0.2, dogY
      )
      
      // 腹部（更圆润的过渡）
      ctx.quadraticCurveTo(
        dogX + dogWidth * 0.1, dogY - dogHeight * 0.1,
        dogX, dogY
      )

      ctx.fill()
    }

    // Animation function
    function animate() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, width, height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, "#0A0C17")
      gradient.addColorStop(0.5, "#1B2A4B")
      gradient.addColorStop(1, "#0D0F1A")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Draw stars with gentle twinkling
      stars.forEach((star) => {
        star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.015
        star.opacity = Math.max(0.3, Math.min(0.8, star.opacity))

        // 绘制星星的光晕效果
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`)
        gradient.addColorStop(0.5, `rgba(138, 254, 254, ${star.opacity * 0.5})`)
        gradient.addColorStop(1, "rgba(138, 254, 254, 0)")

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // 绘制星星的核心
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Randomly add new shooting stars
      if (Math.random() < 0.008 && shootingStars.length < 2) {
        // 从屏幕左侧区域生成流星
        const startX = -50 + Math.random() * (width * 0.3)
        const startY = Math.random() * (height * 0.3)
        const angle = Math.PI / 6 + (Math.random() * Math.PI / 8) // 约30-52.5度角

        shootingStars.push({
          x: startX,
          y: startY,
          length: 80 + Math.random() * 60, // 更长的尾迹
          speed: 4 + Math.random() * 3,    // 更快的速度
          opacity: 0.9 + Math.random() * 0.1,
          angle: angle,
          fadeSpeed: 0.003 + Math.random() * 0.002,
          width: 1.5 + Math.random()       // 动态宽度
        })
      }

      // Draw and update shooting stars
      shootingStars.forEach((star, index) => {
        ctx.save()
        ctx.translate(star.x, star.y)
        ctx.rotate(star.angle)

        // 主尾迹渐变
        const mainGradient = ctx.createLinearGradient(0, 0, star.length, 0)
        mainGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`)
        mainGradient.addColorStop(0.3, `rgba(138, 254, 254, ${star.opacity * 0.8})`)
        mainGradient.addColorStop(0.7, `rgba(138, 254, 254, ${star.opacity * 0.3})`)
        mainGradient.addColorStop(1, "rgba(138, 254, 254, 0)")

        // 绘制主尾迹
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(star.length, 0)
        ctx.strokeStyle = mainGradient
        ctx.lineWidth = star.width
        ctx.stroke()

        // 辉光效果
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8)
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`)
        glowGradient.addColorStop(0.4, `rgba(138, 254, 254, ${star.opacity * 0.6})`)
        glowGradient.addColorStop(1, "rgba(138, 254, 254, 0)")

        // 绘制头部光晕
        ctx.beginPath()
        ctx.fillStyle = glowGradient
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fill()

        // 绘制额外的光晕效果
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`
        ctx.arc(0, 0, 2, 0, Math.PI * 2)
        ctx.fill()

        // 绘制微小的星光点
        for (let i = 0; i < 3; i++) {
          const sparkX = (Math.random() * star.length * 0.3)
          const sparkY = (Math.random() - 0.5) * 4
          const sparkSize = Math.random() * 1.5
          const sparkOpacity = Math.random() * star.opacity

          ctx.beginPath()
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkOpacity})`
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()

        // 更新位置
        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed
        star.opacity -= star.fadeSpeed
        star.width *= 0.995 // 尾迹逐渐变细

        // 移除超出范围的流星
        if (star.opacity <= 0 || star.x > width || star.y > height) {
          shootingStars.splice(index, 1)
        }
      })

      // Draw silhouette
      drawSilhouette()

      requestAnimationFrame(animate)
    }

    // Handle resize
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    window.addEventListener("resize", handleResize)
    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10"
      style={{ width: "100%", height: "100%" }}
    />
  )
}

