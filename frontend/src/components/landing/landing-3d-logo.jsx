import { useEffect, useRef } from "react"

import modelUrl from "@/assets/3dLogo.gltf?url"

const clamp = (value) => Math.min(1, Math.max(0, value))

// Brand colors for the model: secondary teal for the body, accent emerald for
// the swoosh (when the GLTF exposes it as a separate mesh or material).
const PALETTE = { body: "#0A4B52", accent: "#10B981" }
const ACCENT_NAME = /swoosh|wave|curve|accent/i

/**
 * Renders the supplied Accentra GLTF as a restrained section accent.
 *
 * The model is loaded only when this component mounts. Optional motion runs
 * only while visible and when reduced motion is not requested. It is
 * decorative and never receives pointer or focus events.
 */
export function Landing3DLogo({
  className = "",
  animateEntrance = true,
  animateFloatRotate = false,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    // The entrance offset is measured against the stable section slot rather
    // than the moving element, so progress stays accurate while the model is
    // still outside the viewport.
    const track = container.parentElement || container

    let cancelled = false
    let renderer
    let scene
    let camera
    let model
    let environmentTexture
    let resizeObserver
    let intersectionObserver
    let scrollFrame = 0
    let animationFrame = 0
    let isVisible = true
    let baseScale = 1

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    )

    const renderScene = () => {
      if (!renderer || !scene || !camera) return
      renderer.render(scene, camera)
    }

    const getSectionProgress = () => {
      const rect = track.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const start = viewportHeight * 0.92
      const end = viewportHeight * 0.24
      const travel = Math.max(rect.height * 0.9 + start - end, 1)
      return clamp((start - rect.top) / travel)
    }

    const setEntrancePosition = (progress) => {
      const parentWidth = track.clientWidth || 0
      const modelWidth = container.offsetWidth || 1
      const finalX = Math.max((parentWidth - modelWidth) / 2, 0)
      // A short slide from beside its resting place, not from off-screen.
      const startX = finalX - modelWidth * 0.35
      const easedProgress = progress * progress * (3 - 2 * progress)
      const offset =
        !animateEntrance || motionPreference.matches
          ? finalX
          : startX + (finalX - startX) * easedProgress

      container.style.setProperty("--landing-3d-x", `${offset}px`)
      container.style.opacity = !animateEntrance || motionPreference.matches
        ? "1"
        : String(0.4 + 0.6 * easedProgress)
    }

    const applyScrollProgress = (timestamp = performance.now()) => {
      const sectionProgress = getSectionProgress()
      container.dataset.scrollProgress = sectionProgress.toFixed(3)
      setEntrancePosition(sectionProgress)

      if (!model || !isVisible) return

      // Turn the logo toward the viewer as it reaches its resting position.
      const frontFacingRotation = -Math.PI * 0.25
      const rotationY = animateEntrance
        ? motionPreference.matches
          ? 0
          : frontFacingRotation * (1 - sectionProgress)
        : frontFacingRotation
      const elapsed = timestamp / 1000
      model.rotation.set(
        animateFloatRotate && !motionPreference.matches
          ? Math.sin(elapsed * 0.8) * 0.035
          : 0,
        rotationY +
          (animateFloatRotate && !motionPreference.matches
            ? elapsed * 0.32
            : 0),
        animateFloatRotate && !motionPreference.matches
          ? Math.sin(elapsed * 0.65) * 0.025
          : 0,
      )
      model.position.set(
        0,
        animateFloatRotate && !motionPreference.matches
          ? Math.sin(elapsed * 1.6) * 0.08
          : 0,
        0,
      )
      model.scale.setScalar(baseScale)

      renderScene()
    }

    const stopFloatAnimation = () => {
      if (!animationFrame) return
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    const animateFrame = (timestamp) => {
      animationFrame = 0
      if (
        cancelled ||
        !isVisible ||
        !model ||
        !animateFloatRotate ||
        motionPreference.matches
      ) {
        return
      }

      applyScrollProgress(timestamp)
      animationFrame = window.requestAnimationFrame(animateFrame)
    }

    const startFloatAnimation = () => {
      if (
        !animationFrame &&
        isVisible &&
        model &&
        animateFloatRotate &&
        !motionPreference.matches
      ) {
        animationFrame = window.requestAnimationFrame(animateFrame)
      }
    }

    const scheduleRender = () => {
      if (scrollFrame) return
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0
        applyScrollProgress()
      })
    }

    const handleMotionChange = () => {
      if (motionPreference.matches) {
        stopFloatAnimation()
        applyScrollProgress()
      } else {
        startFloatAnimation()
        if (!animateFloatRotate) scheduleRender()
      }
    }

    const initialize = async () => {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ])

        if (cancelled) return

        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
        camera.position.set(0, 0, 4.2)

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1

        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        const roomEnvironment = new RoomEnvironment()
        environmentTexture = pmremGenerator.fromScene(roomEnvironment).texture
        scene.environment = environmentTexture
        roomEnvironment.dispose()
        pmremGenerator.dispose()

        // Soft, even lighting: one key, one brand-colored fill, one rim. No hot
        // specular glints, so the mark reads as a finished object.
        const hemisphereLight = new THREE.HemisphereLight(
          0xbfeee2,
          0x011a16,
          0.45,
        )
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
        keyLight.position.set(2.5, 3.5, 4)
        const emeraldLight = new THREE.PointLight(0x10b981, 0.8, 8)
        emeraldLight.position.set(-2.4, -1.5, 2.5)
        const rimLight = new THREE.PointLight(0xd8fff1, 1.6, 7)
        rimLight.position.set(2, 1.5, -2)

        scene.add(hemisphereLight, keyLight, emeraldLight, rimLight)

        const resize = () => {
          if (!renderer || !camera) return
          const width = Math.max(container.clientWidth, 1)
          const height = Math.max(container.clientHeight, 1)
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          scheduleRender()
        }

        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
        resize()

        const loader = new GLTFLoader()
        loader.load(
          modelUrl,
          (gltf) => {
            if (cancelled || !renderer) {
              gltf.scene.traverse((child) => {
                if (!child.isMesh) return
                child.geometry.dispose()
                if (Array.isArray(child.material)) {
                  child.material.forEach((material) => material.dispose())
                } else {
                  child.material?.dispose()
                }
              })
              return
            }

            const modelRoot = gltf.scene
            const modelGroup = new THREE.Group()
            modelGroup.add(modelRoot)
            modelRoot.traverse((child) => {
              if (!child.isMesh || !child.material) return
              child.castShadow = false
              child.receiveShadow = false

              // Polished, lacquered finish in brand colors. Materials are
              // cloned so the body and the accent can differ even when the
              // source file shares one material.
              const tune = (source) => {
                const material = source.clone()
                const isAccent = ACCENT_NAME.test(
                  `${child.name} ${source.name}`,
                )

                if ("color" in material) {
                  material.color.set(isAccent ? PALETTE.accent : PALETTE.body)
                }
                material.envMapIntensity = 1.2
                // Set transmission to about 0.15 to bring back a hint of
                // translucency.
                if ("transmission" in material) material.transmission = 0
                if ("dispersion" in material) material.dispersion = 0
                if ("iridescence" in material) material.iridescence = 0
                if ("ior" in material) material.ior = 1.5
                if ("roughness" in material) material.roughness = 0.28
                if ("metalness" in material) material.metalness = 0.15
                if ("clearcoat" in material) material.clearcoat = 0.6
                if ("clearcoatRoughness" in material) {
                  material.clearcoatRoughness = 0.12
                }
                material.needsUpdate = true
                return material
              }

              child.material = Array.isArray(child.material)
                ? child.material.map(tune)
                : tune(child.material)
            })

            modelRoot.updateMatrixWorld(true)
            const bounds = new THREE.Box3().setFromObject(modelRoot)
            const center = bounds.getCenter(new THREE.Vector3())
            const size = bounds.getSize(new THREE.Vector3())
            const maxDimension = Math.max(size.x, size.y, size.z, 0.001)

            modelRoot.position.x -= center.x
            modelRoot.position.y -= center.y
            modelRoot.position.z -= center.z
            baseScale = 1.8 / maxDimension
            modelRoot.scale.setScalar(1)

            model = modelGroup
            model.rotation.set(0, 0, 0)
            model.position.set(0, 0, 0)
            scene.add(model)
            applyScrollProgress()
            startFloatAnimation()
            resize()
          },
          undefined,
          () => {
            // A decorative model should never block the rest of the landing page.
          },
        )

        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            isVisible = entry.isIntersecting
            if (isVisible) {
              startFloatAnimation()
              if (!animateFloatRotate) scheduleRender()
            } else {
              stopFloatAnimation()
            }
          },
          { rootMargin: "160px" },
        )
        intersectionObserver.observe(track)
      } catch {
        // WebGL or the optional model runtime is unavailable; the page remains usable.
      }
    }

    const handleScroll = () => {
      if (isVisible) scheduleRender()
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", scheduleRender)
    motionPreference.addEventListener?.("change", handleMotionChange)
    initialize()

    return () => {
      cancelled = true
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", scheduleRender)
      motionPreference.removeEventListener?.("change", handleMotionChange)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      stopFloatAnimation()
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      model?.traverse((child) => {
        if (!child.isMesh) return
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose())
        } else {
          child.material?.dispose()
        }
      })
      environmentTexture?.dispose()
      renderer?.dispose()
    }
  }, [animateEntrance, animateFloatRotate])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`landing-3d-logo pointer-events-none absolute overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}