"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from "@/components/ui/card"

interface FeaturedTool {
  id: string
  name_en: string
  name_zh: string
  description_en: string
  description_zh: string
  image_url: string
  link: string
}

interface FeaturedCarouselProps {
  locale: string
  tools: FeaturedTool[]
}

export function FeaturedCarousel({ locale, tools }: FeaturedCarouselProps) {
  const isZh = locale === "zh"
  const [api, setApi] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [snapList, setSnapList] = useState<number[]>([])

  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap())
    }
    api.on("select", onSelect)
    setSnapList(api.scrollSnapList())
    onSelect()
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const scrollTo = (idx: number) => {
    if (api) api.scrollTo(idx)
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">
          {isZh ? "精选推荐" : "Featured Picks"}
        </h2>
        <Carousel
          setApi={setApi}
          plugins={[Autoplay({ delay: 3000 })]}
          opts={{ loop: true, align: "start" }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {tools.map((tool) => (
              <CarouselItem
                key={tool.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <Card className="overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all">
                  <Link href={tool.link} target="_blank">
                    {tool.image_url && (
                      <div className="w-full h-40 relative">
                        <Image
                          src={tool.image_url}
                          alt={isZh ? tool.name_zh : tool.name_en}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">
                        {isZh ? tool.name_zh : tool.name_en}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isZh
                          ? tool.description_zh
                          : tool.description_en}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="!bg-white/70 !backdrop-blur border border-gray-200 shadow-lg hover:scale-110 transition-all !w-10 !h-10 !rounded-full flex items-center justify-center z-10 left-3 top-1/2 -translate-y-1/2" />
          <CarouselNext className="!bg-white/70 !backdrop-blur border border-gray-200 shadow-lg hover:scale-110 transition-all !w-10 !h-10 !rounded-full flex items-center justify-center z-10 right-3 top-1/2 -translate-y-1/2" />

        </Carousel>

        <div className="flex justify-center mt-4 space-x-2">
          {snapList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                idx === currentIndex ? "bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
