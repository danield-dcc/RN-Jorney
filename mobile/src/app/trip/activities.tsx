import dayjs from 'dayjs'
import {
  Calendar as IconCalendar,
  Clock,
  PlusIcon,
  Tag,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Keyboard, SectionList, Text, View } from 'react-native'

import { Activity, ActivityProps } from '@/components/activity'
import { Button } from '@/components/button'
import { Calendar } from '@/components/calendar'
import { Input } from '@/components/input'
import { LoadingIndicator } from '@/components/loading'
import { Modal } from '@/components/modal'
import { activitiesServer } from '@/server/activities-server'
import { colors } from '@/styles/colors'

import { TripData } from './[id]'

type Props = {
  tripDetails: TripData
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  NEW_ACTIVITY = 2,
}

type TripActivities = {
  title: {
    dayNumber: number
    dayName: string
  }
  data: ActivityProps[]
}

export function Activities({ tripDetails }: Props) {
  const [showModal, setShowModal] = useState(MODAL.NONE)

  const [isCreatingActivity, setIsCreatingActivity] = useState(false)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)

  const [activityTitle, setActivityTitle] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [activityHour, setActivityHour] = useState('')

  const [tripActivities, setTripActivities] = useState<TripActivities[]>([])

  function resetNewActivityFields() {
    setActivityTitle('')
    setActivityDate('')
    setActivityHour('')
    setShowModal(MODAL.NONE)
  }

  async function handleCreateTripActivity() {
    try {
      if (!activityDate || !activityTitle || !activityHour) {
        return Alert.alert(
          'Cadastrar atividade',
          'Para a descrição preencha todos os campos.',
        )
      }
      await activitiesServer.create({
        tripId: tripDetails.id,
        occurs_at: dayjs(activityDate)
          .add(Number(activityHour), 'h')
          .toString(),
        title: activityTitle,
      })

      console.log("activityDate ==>", activityDate)

      Alert.alert('Nova Atividade', 'Nova atividade cadastrada com sucesso!')

      await getTripActivities()

      resetNewActivityFields()
    } catch (error) {
      console.log(error)
    } finally {
      setIsCreatingActivity(false)
    }
  }

  async function getTripActivities() {
    try {
      const activities = await activitiesServer.getActivitiesByTripId(
        tripDetails.id,
      )

      // formatando os dados para utilizar em uma SectionList
      const activitiesToSectionList = activities.map((dayActivity) => ({
        title: {
          dayNumber: dayjs(dayActivity.date).date(),
          dayName: dayjs(dayActivity.date).format('dddd').replace('-feira', ''),
        },
        data: dayActivity.activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          hour: dayjs(activity.occurs_at).format('hh[:]mm[h]'),
          isBefore: dayjs(activity.occurs_at).isBefore(dayjs()),
        })),
      }))

      console.log("activities +++", JSON.stringify(activities, null, 2))


      console.log(JSON.stringify(activitiesToSectionList, null, 2))

      setTripActivities(activitiesToSectionList)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    if (tripDetails.id) {
      getTripActivities()
    }
  }, [tripDetails])

  return (
    <View className="flex-1">
      <View className="mb-6 mt-5 w-full flex-row items-center">
        <Text className="flex-1 font-semibold text-2xl text-zinc-50">
          Atividades
        </Text>

        <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
          <PlusIcon color={colors.lime[950]} />
          <Button.Title>Nova Atividade</Button.Title>
        </Button>
      </View>

      {isLoadingActivities ? (
        <LoadingIndicator />
      ) : (
        <SectionList
          sections={tripActivities || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Activity data={item} />}
          renderSectionHeader={({ section }) => (
            <View className="w-full">
              <Text className="py-2 font-semibold text-2xl text-zinc-50">
                Dia {section.title.dayNumber}
                <Text className="text-zinc0500 font-regular text-base capitalize">
                  {' '}
                  {section.title.dayName}
                </Text>
              </Text>

              {section.data.length === 0 && (
                <Text className="mb-8 font-regular text-sm text-zinc-500">
                  Nenhuma atividade cadastrada nessa data.
                </Text>
              )}
            </View>
          )}
          contentContainerClassName="gap-3 pb-48"
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        title="Cadastrar atividade"
        subtitle="Todos os convidados podem visualizar as atividades"
        visible={showModal === MODAL.NEW_ACTIVITY}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="mb-3 mt-4">
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Qual atividade"
              onChangeText={setActivityTitle}
              value={activityTitle}
            />
          </Input>

          <View className="mt-3 w-full flex-row gap-2">
            <Input variant="secondary" className="flex-1">
              <IconCalendar color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Data"
                onChangeText={setActivityDate}
                value={
                  activityDate ? dayjs(activityDate).format('DD [de] MMM') : ''
                }
                onFocus={() => Keyboard.dismiss()}
                showSoftInputOnFocus={false}
                onPressIn={() => setShowModal(MODAL.CALENDAR)}
              />
            </Input>
            <Input variant="secondary" className="flex-1">
              <Clock color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Qual horário"
                onChangeText={(text) =>
                  setActivityHour(text.replace('.', '').replace(',', ''))
                }
                value={activityHour}
                keyboardType="numeric"
                maxLength={2}
              />
            </Input>
          </View>
        </View>
        <Button
          onPress={handleCreateTripActivity}
          isLoading={isCreatingActivity}
        >
          <Button.Title>Salvar atividade</Button.Title>
        </Button>
      </Modal>

      <Modal
        title="Selecionar data"
        subtitle="Selecione a data da atividade"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="mt-4 gap-4">
          {tripDetails.starts_at && (
            <Calendar
              onDayPress={(day) => setActivityDate(day.dateString)}
              markedDates={{ [activityDate]: { selected: true } }}
              initialDate={tripDetails.starts_at.toString()}
              minDate={tripDetails.starts_at.toString()}
              maxDate={tripDetails.ends_at.toString()}
            />
          )}

          <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
